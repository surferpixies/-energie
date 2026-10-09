package ca.surferpixies.energie

import android.content.Intent
import android.net.Uri
import android.os.Build
import androidx.activity.result.ActivityResult
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.*
import androidx.health.connect.client.request.AggregateGroupByPeriodRequest
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import com.getcapacitor.*
import com.getcapacitor.annotation.ActivityCallback
import com.getcapacitor.annotation.CapacitorPlugin
import kotlinx.coroutines.*
import java.time.*

@CapacitorPlugin(name = "HealthConnect")
class HealthConnectPlugin : Plugin() {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val permissions = setOf(
        HealthPermission.getReadPermission(StepsRecord::class),
        HealthPermission.getReadPermission(SleepSessionRecord::class),
        HealthPermission.getReadPermission(ExerciseSessionRecord::class),
        HealthPermission.getReadPermission(WeightRecord::class)
    )
    private fun available() = Build.VERSION.SDK_INT >= 28 &&
        HealthConnectClient.getSdkStatus(context) == HealthConnectClient.SDK_AVAILABLE

    @PluginMethod
    fun isAvailable(call: PluginCall) {
        val status = if (Build.VERSION.SDK_INT >= 28) HealthConnectClient.getSdkStatus(context) else HealthConnectClient.SDK_UNAVAILABLE
        call.resolve(JSObject().put("available", status == HealthConnectClient.SDK_AVAILABLE)
            .put("updateRequired", status == HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED))
    }

    @PluginMethod
    fun openProvider(call: PluginCall) {
        try {
            val intent = if (available()) HealthConnectClient.getHealthConnectManageDataIntent(context)
                else Intent(Intent.ACTION_VIEW, Uri.parse("https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata"))
            activity.startActivity(intent)
            call.resolve()
        } catch (e: Exception) { call.reject("Impossible d’ouvrir Health Connect.", e) }
    }

    @PluginMethod
    fun requestAuthorization(call: PluginCall) {
        if (!available()) { call.reject("Installe ou mets à jour Health Connect avant de continuer."); return }
        val contract = PermissionController.createRequestPermissionResultContract()
        startActivityForResult(call, contract.createIntent(context, permissions), "authorizationResult")
    }

    @ActivityCallback
    private fun authorizationResult(call: PluginCall?, result: ActivityResult) {
        if (call == null) return
        scope.launch {
            try {
                val granted = HealthConnectClient.getOrCreate(context).permissionController.getGrantedPermissions()
                call.resolve(JSObject().put("authorized", permissions.any { it in granted })
                    .put("allGranted", granted.containsAll(permissions)))
            } catch (e: Exception) { call.reject("Impossible de vérifier les autorisations Health Connect.", e) }
        }
    }

    // Une lecture indépendante par catégorie : un refus n’empêche pas les autres imports.
    @PluginMethod
    fun readSnapshot(call: PluginCall) {
        if (!available()) { call.reject("Health Connect n’est pas disponible."); return }
        scope.launch {
            try {
                val client = HealthConnectClient.getOrCreate(context)
                val granted = client.permissionController.getGrantedPermissions()
                val zone = ZoneId.systemDefault()
                val requested = LocalDate.parse(call.getString("startDate"))
                // Sans permission d’historique supplémentaire, rester dans la fenêtre accessible.
                val start = maxOf(requested, LocalDate.now(zone).minusDays(28)).atStartOfDay(zone).toInstant()
                val end = Instant.now()
                val filter = TimeRangeFilter.between(start, end)
                val output = JSObject().put("days", JSArray()).put("samples", JSArray())
                    .put("workouts", JSArray()).put("measurements", JSArray())
                val errors = JSArray()
                suspend fun read(label: String, permission: String, task: suspend () -> Unit) {
                    if (permission !in granted) return
                    try { task() } catch (e: CancellationException) { throw e }
                    catch (e: Exception) { errors.put(label) }
                }
                read("pas", HealthPermission.getReadPermission(StepsRecord::class)) {
                    // L’agrégat respecte les priorités des sources et évite leur double comptage.
                    val buckets = client.aggregateGroupByPeriod(AggregateGroupByPeriodRequest(
                        metrics = setOf(StepsRecord.COUNT_TOTAL),
                        timeRangeFilter = TimeRangeFilter.between(LocalDateTime.ofInstant(start, zone), LocalDateTime.ofInstant(end, zone)),
                        timeRangeSlicer = Period.ofDays(1)))
                    val days = JSArray()
                    for (bucket in buckets) {
                        // Le premier jour peut être tronqué par la limite de lecture : ne pas l’importer.
                        if (bucket.startTime.toLocalTime() != LocalTime.MIDNIGHT) continue
                        val count = bucket.result[StepsRecord.COUNT_TOTAL] ?: continue
                        days.put(JSObject().put("date", bucket.startTime.toLocalDate().toString()).put("steps", count))
                    }
                    output.put("days", days)
                }
                read("sommeil", HealthPermission.getReadPermission(SleepSessionRecord::class)) {
                    val values = JSArray()
                    for (record in records<SleepSessionRecord>(client, filter)) {
                        // Une séance sans stades ne prouve pas une durée de sommeil effectif.
                        for (stage in record.stages) {
                            val name = when (stage.stage) {
                                SleepSessionRecord.STAGE_TYPE_SLEEPING -> "asleep"
                                SleepSessionRecord.STAGE_TYPE_LIGHT -> "core"
                                SleepSessionRecord.STAGE_TYPE_DEEP -> "deep"
                                SleepSessionRecord.STAGE_TYPE_REM -> "rem"
                                else -> null
                            } ?: continue
                            values.put(JSObject().put("startDate", stage.startTime.toString())
                                .put("endDate", stage.endTime.toString()).put("stage", name))
                        }
                    }
                    output.put("samples", values)
                }
                read("activités", HealthPermission.getReadPermission(ExerciseSessionRecord::class)) {
                    val values = JSArray()
                    for (record in records<ExerciseSessionRecord>(client, filter)) {
                        values.put(JSObject().put("uuid", record.metadata.id)
                            .put("startDate", record.startTime.toString()).put("endDate", record.endTime.toString())
                            .put("durationMinutes", Duration.between(record.startTime, record.endTime).toMillis() / 60000.0)
                            .put("energieType", activityName(record.exerciseType))
                            .put("activityName", record.title ?: "Activité Health Connect")
                            .put("originalType", record.exerciseType.toString())
                            .put("sourceApp", record.metadata.dataOrigin.packageName))
                    }
                    output.put("workouts", values)
                }
                read("poids", HealthPermission.getReadPermission(WeightRecord::class)) {
                    val values = JSArray()
                    for (record in records<WeightRecord>(client, filter)) {
                        values.put(JSObject().put("date", record.time.toString()).put("kg", record.weight.inKilograms))
                    }
                    output.put("measurements", values)
                }
                output.put("errors", errors).put("authorized", permissions.any { it in granted })
                call.resolve(output)
            } catch (e: CancellationException) { call.reject("Lecture interrompue.") }
            catch (e: Exception) { call.reject("Impossible de lire Health Connect.", e) }
        }
    }

    private suspend inline fun <reified T : Record> records(client: HealthConnectClient, filter: TimeRangeFilter): List<T> {
        val all = mutableListOf<T>()
        var token: String? = null
        do {
            val page = client.readRecords(ReadRecordsRequest(T::class, timeRangeFilter = filter, pageToken = token))
            all.addAll(page.records)
            token = page.pageToken?.takeIf { it.isNotEmpty() }
        } while (token != null)
        return all
    }

    private fun activityName(type: Int): String = when (type) {
        ExerciseSessionRecord.EXERCISE_TYPE_WALKING -> "Marche"
        ExerciseSessionRecord.EXERCISE_TYPE_RUNNING, ExerciseSessionRecord.EXERCISE_TYPE_RUNNING_TREADMILL -> "Course"
        ExerciseSessionRecord.EXERCISE_TYPE_BIKING, ExerciseSessionRecord.EXERCISE_TYPE_BIKING_STATIONARY -> "Vélo"
        ExerciseSessionRecord.EXERCISE_TYPE_SWIMMING_POOL, ExerciseSessionRecord.EXERCISE_TYPE_SWIMMING_OPEN_WATER -> "Natation"
        ExerciseSessionRecord.EXERCISE_TYPE_STRENGTH_TRAINING, ExerciseSessionRecord.EXERCISE_TYPE_WEIGHTLIFTING -> "Musculation"
        ExerciseSessionRecord.EXERCISE_TYPE_YOGA -> "Yoga"
        ExerciseSessionRecord.EXERCISE_TYPE_PILATES -> "Pilates"
        ExerciseSessionRecord.EXERCISE_TYPE_HIKING -> "Randonnée"
        ExerciseSessionRecord.EXERCISE_TYPE_DANCING -> "Danse"
        ExerciseSessionRecord.EXERCISE_TYPE_ELLIPTICAL -> "Elliptique"
        ExerciseSessionRecord.EXERCISE_TYPE_ROWING, ExerciseSessionRecord.EXERCISE_TYPE_ROWING_MACHINE -> "Rameur"
        ExerciseSessionRecord.EXERCISE_TYPE_HIGH_INTENSITY_INTERVAL_TRAINING -> "HIIT"
        ExerciseSessionRecord.EXERCISE_TYPE_STRETCHING -> "Étirements"
        ExerciseSessionRecord.EXERCISE_TYPE_STAIR_CLIMBING, ExerciseSessionRecord.EXERCISE_TYPE_STAIR_CLIMBING_MACHINE -> "Escaliers"
        ExerciseSessionRecord.EXERCISE_TYPE_BADMINTON -> "Badminton"
        ExerciseSessionRecord.EXERCISE_TYPE_TENNIS -> "Tennis"
        ExerciseSessionRecord.EXERCISE_TYPE_TABLE_TENNIS -> "Tennis de table"
        ExerciseSessionRecord.EXERCISE_TYPE_SQUASH -> "Squash"
        ExerciseSessionRecord.EXERCISE_TYPE_RACQUETBALL -> "Racquetball"
        ExerciseSessionRecord.EXERCISE_TYPE_SOCCER -> "Soccer"
        ExerciseSessionRecord.EXERCISE_TYPE_BASKETBALL -> "Basketball"
        ExerciseSessionRecord.EXERCISE_TYPE_BASEBALL -> "Baseball"
        ExerciseSessionRecord.EXERCISE_TYPE_VOLLEYBALL -> "Volleyball"
        ExerciseSessionRecord.EXERCISE_TYPE_ICE_HOCKEY, ExerciseSessionRecord.EXERCISE_TYPE_ROLLER_HOCKEY -> "Hockey"
        ExerciseSessionRecord.EXERCISE_TYPE_ICE_SKATING -> "Patinage"
        ExerciseSessionRecord.EXERCISE_TYPE_SKIING -> "Ski"
        ExerciseSessionRecord.EXERCISE_TYPE_SNOWBOARDING -> "Snowboard"
        ExerciseSessionRecord.EXERCISE_TYPE_BOXING -> "Boxe"
        ExerciseSessionRecord.EXERCISE_TYPE_MARTIAL_ARTS -> "Arts martiaux"
        ExerciseSessionRecord.EXERCISE_TYPE_GOLF -> "Golf"
        ExerciseSessionRecord.EXERCISE_TYPE_ROCK_CLIMBING -> "Escalade"
        ExerciseSessionRecord.EXERCISE_TYPE_PADDLING -> "Sports de pagaie"
        ExerciseSessionRecord.EXERCISE_TYPE_SURFING -> "Sports de surf"
        else -> "Autre"
    }

    override fun handleOnDestroy() { scope.cancel() }
}
