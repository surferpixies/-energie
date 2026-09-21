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
        CAPPluginMethod(name: "readWorkouts", returnType: CAPPluginReturnPromise)
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
        case .walking:
            return "Marche"

        case .running:
            return "Course"

        case .cycling:
            return "Vélo"

        case .traditionalStrengthTraining,
             .functionalStrengthTraining:
            return "Musculation"

        case .yoga:
            return "Yoga"

        case .swimming:
            return "Natation"

        case .waterFitness:
            return "Aquagym"

        case .waterSports:
            return "Aquagym"

        case .hiking:
            return "Randonnée"

        case .pilates:
            return "Pilates"

        case .dance:
            return "Danse"

        case .elliptical:
            return "Elliptique"

        case .rowing:
            return "Rameur"

        case .tennis:
            return "Tennis"

        case .badminton:
            return "Badminton"

        case .soccer:
            return "Soccer"

        case .hockey:
            return "Hockey"

        case .pickleball:
            return "Pickleball"

        case .volleyball:
            return "Volleyball"

        case .crossCountrySkiing:
            return "Ski de fond"

        case .skatingSports:
            return "Patinage"

        case .stairClimbing,
             .stairs:
            return "Escaliers"

        case .highIntensityIntervalTraining:
            return "HIIT"

        case .flexibility,
             .cooldown:
            return "Étirements"

        default:
            return "Autre"
        }
    }

    private func appleActivityName(_ type: HKWorkoutActivityType) -> String {
        switch type {
        case .walking: return "Walking"
        case .running: return "Running"
        case .cycling: return "Cycling"
        case .traditionalStrengthTraining: return "Traditional Strength Training"
        case .functionalStrengthTraining: return "Functional Strength Training"
        case .yoga: return "Yoga"
        case .swimming: return "Swimming"
        case .waterFitness: return "Water Fitness"
        case .waterSports: return "Water Sports"
        case .hiking: return "Hiking"
        case .pilates: return "Pilates"
        case .dance: return "Dance"
        case .elliptical: return "Elliptical"
        case .rowing: return "Rowing"
        case .tennis: return "Tennis"
        case .badminton: return "Badminton"
        case .soccer: return "Soccer"
        case .hockey: return "Hockey"
        case .pickleball: return "Pickleball"
        case .volleyball: return "Volleyball"
        case .crossCountrySkiing: return "Cross-country skiing"
        case .skatingSports: return "Skating"
        case .stairClimbing: return "Stair climbing"
        case .stairs: return "Stairs"
        case .highIntensityIntervalTraining: return "HIIT"
        case .flexibility: return "Flexibility"
        case .cooldown: return "Cooldown"
        default:
            return "Apple Health activity \(type.rawValue)"
        }
    }

    // MARK: - Helpers

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
