import Foundation
import Capacitor
import HealthKit

@objc(HealthKitPlugin)
public class HealthKitPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "HealthKitPlugin"
    public let jsName = "HealthKit"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isAvailable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestAuthorization", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "readSteps", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "readSleep", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "readWorkouts", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "readWeight", returnType: CAPPluginReturnPromise)
    ]

    private let healthStore = HKHealthStore()

    @objc func isAvailable(_ call: CAPPluginCall) {
        call.resolve([
            "available": HKHealthStore.isHealthDataAvailable()
        ])
    }

    @objc func requestAuthorization(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else {
            call.reject("Apple Health n’est pas disponible sur cet appareil.")
            return
        }

        var readTypes = Set<HKObjectType>()

        if let steps = HKObjectType.quantityType(forIdentifier: .stepCount) {
            readTypes.insert(steps)
        }

        if let sleep = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) {
            readTypes.insert(sleep)
        }

        readTypes.insert(HKObjectType.workoutType())

        if let weight = HKObjectType.quantityType(forIdentifier: .bodyMass) {
            readTypes.insert(weight)
        }

        healthStore.requestAuthorization(toShare: [], read: readTypes) { success, error in
            DispatchQueue.main.async {
                if let error = error {
                    call.reject(
                        "Impossible d’autoriser Apple Health : \(error.localizedDescription)"
                    )
                    return
                }

                call.resolve(["authorized": success])
            }
        }
    }

    @objc func readSteps(_ call: CAPPluginCall) {
        guard let stepType = HKObjectType.quantityType(forIdentifier: .stepCount) else {
            call.reject("Le nombre de pas n’est pas disponible.")
            return
        }

        let startDate = dateFromCall(call, key: "startDate")
            ?? Calendar.current.startOfDay(for: Date())

        let endDate = dateFromCall(call, key: "endDate") ?? Date()

        let predicate = HKQuery.predicateForSamples(
            withStart: startDate,
            end: endDate,
            options: .strictStartDate
        )

        let query = HKStatisticsQuery(
            quantityType: stepType,
            quantitySamplePredicate: predicate,
            options: .cumulativeSum
        ) { _, result, error in
            if let error = error {
                call.reject("Impossible de lire les pas : \(error.localizedDescription)")
                return
            }

            let steps = result?
                .sumQuantity()?
                .doubleValue(for: HKUnit.count()) ?? 0

            call.resolve([
                "steps": Int(steps.rounded())
            ])
        }

        healthStore.execute(query)
    }

    @objc func readSleep(_ call: CAPPluginCall) {
        guard let sleepType = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) else {
            call.reject("Les données de sommeil ne sont pas disponibles.")
            return
        }

        let startDate = dateFromCall(call, key: "startDate")
            ?? Calendar.current.date(byAdding: .day, value: -2, to: Date())!

        let endDate = dateFromCall(call, key: "endDate") ?? Date()

        let predicate = HKQuery.predicateForSamples(
            withStart: startDate,
            end: endDate,
            options: []
        )

        let sort = NSSortDescriptor(
            key: HKSampleSortIdentifierStartDate,
            ascending: true
        )

        let query = HKSampleQuery(
            sampleType: sleepType,
            predicate: predicate,
            limit: HKObjectQueryNoLimit,
            sortDescriptors: [sort]
        ) { _, samples, error in
            if let error = error {
                call.reject("Impossible de lire le sommeil : \(error.localizedDescription)")
                return
            }

            let sleepSamples = (samples as? [HKCategorySample]) ?? []

            let result: [[String: Any]] = sleepSamples.map { sample in
                [
                    "startDate": self.isoString(sample.startDate),
                    "endDate": self.isoString(sample.endDate),
                    "value": sample.value,
                    "stage": self.sleepStage(sample.value),
                    "source": sample.sourceRevision.source.name
                ]
            }

            call.resolve([
                "samples": result
            ])
        }

        healthStore.execute(query)
    }

    @objc func readWorkouts(_ call: CAPPluginCall) {
        let workoutType = HKObjectType.workoutType()

        let startDate = dateFromCall(call, key: "startDate")
            ?? Calendar.current.date(byAdding: .day, value: -7, to: Date())!

        let endDate = dateFromCall(call, key: "endDate") ?? Date()

        let datePredicate = HKQuery.predicateForSamples(
            withStart: startDate,
            end: endDate,
            options: []
        )

        let sort = NSSortDescriptor(
            key: HKSampleSortIdentifierStartDate,
            ascending: true
        )

        let query = HKSampleQuery(
            sampleType: workoutType,
            predicate: datePredicate,
            limit: HKObjectQueryNoLimit,
            sortDescriptors: [sort]
        ) { _, samples, error in
            if let error = error {
                call.reject("Impossible de lire les activités : \(error.localizedDescription)")
                return
            }

            let workouts = (samples as? [HKWorkout]) ?? []

            let result: [[String: Any]] = workouts.map { workout in
                var item: [String: Any] = [
                    "uuid": workout.uuid.uuidString,
                    "activityType": workout.workoutActivityType.rawValue,
                    "activityName": self.appleActivityName(workout.workoutActivityType),
                    "energieType": self.energieActivityName(workout.workoutActivityType),
                    "startDate": self.isoString(workout.startDate),
                    "endDate": self.isoString(workout.endDate),
                    "durationMinutes": Int((workout.duration / 60.0).rounded()),
                    "source": workout.sourceRevision.source.name
                ]

                if let calories = workout.totalEnergyBurned {
                    item["calories"] = Int(
                        calories.doubleValue(for: .kilocalorie()).rounded()
                    )
                }

                return item
            }

            call.resolve([
                "workouts": result
            ])
        }

        healthStore.execute(query)
    }

    // MARK: - Énergie activity mapping

    private func energieActivityName(_ type: HKWorkoutActivityType) -> String {
        switch type {
        case .archery: return "Tir à l’arc"
        case .bowling: return "Bowling"
        case .fencing: return "Escrime"
        case .gymnastics: return "Gymnastique"
        case .trackAndField: return "Athlétisme"

        case .americanFootball: return "Football américain"
        case .australianFootball: return "Football australien"
        case .baseball: return "Baseball"
        case .basketball: return "Basketball"
        case .cricket: return "Cricket"
        case .discSports: return "Sports de disque"
        case .handball: return "Handball"
        case .hockey: return "Hockey"
        case .lacrosse: return "Lacrosse"
        case .rugby: return "Rugby"
        case .soccer: return "Soccer"
        case .softball: return "Softball"
        case .volleyball: return "Volleyball"

        case .walking: return "Marche"
        case .running: return "Course"
        case .cycling: return "Vélo"
        case .coreTraining: return "Entraînement du tronc"
        case .elliptical: return "Elliptique"
        case .functionalStrengthTraining: return "Musculation fonctionnelle"
        case .traditionalStrengthTraining: return "Musculation"
        case .crossTraining: return "Cross-training"
        case .mixedCardio: return "Cardio mixte"
        case .highIntensityIntervalTraining: return "HIIT"
        case .jumpRope: return "Corde à sauter"
        case .stairClimbing, .stairs: return "Escaliers"
        case .stepTraining: return "Step"
        case .fitnessGaming: return "Jeu vidéo actif"
        case .preparationAndRecovery: return "Étirements"
        case .flexibility, .cooldown: return "Étirements"

        case .barre: return "Barre"
        case .cardioDance: return "Danse cardio"
        case .socialDance: return "Danse sociale"
        case .dance: return "Danse cardio"
        case .yoga: return "Yoga"
        case .mindAndBody: return "Corps et esprit"
        case .pilates: return "Pilates"

        case .badminton: return "Badminton"
        case .pickleball: return "Pickleball"
        case .racquetball: return "Racquetball"
        case .squash: return "Squash"
        case .tableTennis: return "Tennis de table"
        case .tennis: return "Tennis"

        case .climbing: return "Escalade"
        case .equestrianSports: return "Équitation"
        case .fishing: return "Pêche"
        case .golf: return "Golf"
        case .hiking: return "Randonnée"

        case .crossCountrySkiing: return "Ski de fond"
        case .curling: return "Curling"
        case .downhillSkiing: return "Ski alpin"
        case .snowSports: return "Sports de neige"
        case .snowboarding: return "Snowboard"
        case .skatingSports: return "Patinage"

        case .paddleSports: return "Sports de pagaie"
        case .rowing: return "Rameur"
        case .sailing: return "Voile"
        case .surfingSports: return "Sports de surf"
        case .swimming: return "Natation"
        case .waterFitness: return "Fitness aquatique"
        case .waterPolo: return "Water-polo"
        case .waterSports: return "Sports aquatiques"

        case .boxing: return "Boxe"
        case .kickboxing: return "Kickboxing"
        case .martialArts: return "Arts martiaux"
        case .taiChi: return "Tai-chi"
        case .wrestling: return "Lutte"

        case .other: return "Autre"

        default:
            return "Autre"
        }
    }

    private func appleActivityName(_ type: HKWorkoutActivityType) -> String {
        switch type {
        case .waterFitness: return "Water Fitness"
        case .waterSports: return "Water Sports"
        case .waterPolo: return "Water Polo"
        case .swimming: return "Swimming"
        case .paddleSports: return "Paddle Sports"
        case .rowing: return "Rowing"
        case .sailing: return "Sailing"
        case .surfingSports: return "Surfing Sports"
        default:
            return String(describing: type)
        }
    }

    @objc func readWeight(_ call: CAPPluginCall) {
        guard let weightType = HKObjectType.quantityType(forIdentifier: .bodyMass) else {
            call.reject("Le poids n’est pas disponible.")
            return
        }
        let startDate = dateFromCall(call, key: "startDate")
            ?? Calendar.current.date(byAdding: .day, value: -180, to: Date())!
        let endDate = dateFromCall(call, key: "endDate") ?? Date()
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate, options: .strictStartDate)
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
        let query = HKSampleQuery(sampleType: weightType, predicate: predicate, limit: 200, sortDescriptors: [sort]) { _, samples, error in
            if let error = error {
                call.reject("Impossible de lire le poids : \(error.localizedDescription)")
                return
            }
            let unit = HKUnit.gramUnit(with: .kilo)
            let formatter = ISO8601DateFormatter()
            let values = (samples as? [HKQuantitySample] ?? []).map { sample -> [String: Any] in
                ["kg": sample.quantity.doubleValue(for: unit), "date": formatter.string(from: sample.endDate)]
            }
            call.resolve(["measurements": values])
        }
        self.healthStore.execute(query)
    }

    private func dateFromCall(_ call: CAPPluginCall, key: String) -> Date? {
        guard let value = call.getString(key) else {
            return nil
        }

        return ISO8601DateFormatter().date(from: value)
    }

    private func isoString(_ date: Date) -> String {
        ISO8601DateFormatter().string(from: date)
    }

    private func sleepStage(_ value: Int) -> String {
        if #available(iOS 16.0, *) {
            switch value {
            case HKCategoryValueSleepAnalysis.awake.rawValue:
                return "awake"
            case HKCategoryValueSleepAnalysis.asleepCore.rawValue:
                return "core"
            case HKCategoryValueSleepAnalysis.asleepDeep.rawValue:
                return "deep"
            case HKCategoryValueSleepAnalysis.asleepREM.rawValue:
                return "rem"
            case HKCategoryValueSleepAnalysis.asleepUnspecified.rawValue:
                return "asleep"
            default:
                break
            }
        }

        if value == HKCategoryValueSleepAnalysis.inBed.rawValue {
            return "inBed"
        }

        // Avant iOS 16, la valeur historique 1 correspond à "asleep".
        if value == 1 {
            return "asleep"
        }

        return "unknown"
    }
}
