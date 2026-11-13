import json


class NotificationEventBus:
    def __init__(self):
        self._observers = []

    def subscribe(self, observer):
        self._observers.append(observer)

    def publish(self, connection, event):
        for observer in tuple(self._observers):
            observer(connection, event)


def _persist_parent_notification(connection, event):
    preference_key = {
        "consulta": "consultas",
        "turno": "turnos",
        "medicacion": "medicacion",
        "vacuna": "vacunas",
    }.get(event["kind"])
    with connection.cursor() as cursor:
        cursor.execute(
            """SELECT pm.id_usuario,pm.preferencias_notificacion
               FROM paciente p
               JOIN padre_madre pm ON pm.id_usuario=p.id_tutor_1 OR pm.id_usuario=p.id_tutor_2
               WHERE p.id_paciente=%s AND pm.recibe_notificaciones_app=TRUE""",
            (event["patient_id"],),
        )
        for parent in cursor.fetchall():
            preferences = parent["preferencias_notificacion"]
            if isinstance(preferences, str):
                preferences = json.loads(preferences or "{}")
            if (
                preference_key
                and isinstance(preferences, dict)
                and preferences.get(preference_key) is False
            ):
                continue
            cursor.execute(
                """INSERT INTO notificacion
                     (id_usuario,id_paciente,canal,tipo,contenido,estado)
                   VALUES (%s,%s,'APP',%s,%s,'Enviada')""",
                (
                    parent["id_usuario"],
                    event["patient_id"],
                    event["kind"],
                    event["message"],
                ),
            )


notification_events = NotificationEventBus()
notification_events.subscribe(_persist_parent_notification)


def notify_patient_tutors(connection, patient_id, kind, message):
    notification_events.publish(
        connection,
        {"patient_id": patient_id, "kind": kind, "message": message},
    )
