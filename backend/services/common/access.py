class PatientAccessStrategy:
    def filter_clause(self, user, alias):
        raise NotImplementedError


class ProfessionalPatientAccess(PatientAccessStrategy):
    def filter_clause(self, _user, _alias):
        return "", ()


class ParentPatientAccess(PatientAccessStrategy):
    def filter_clause(self, user, alias):
        return (
            f" AND ({alias}.id_tutor_1=%s OR {alias}.id_tutor_2=%s)",
            (user["id"], user["id"]),
        )


_PATIENT_ACCESS = {
    "MEDICO": ProfessionalPatientAccess(),
    "ENFERMERO": ProfessionalPatientAccess(),
    "PADRE_MADRE": ParentPatientAccess(),
}


def patient_access_filter(user, alias="p"):
    return _PATIENT_ACCESS[user["role"]].filter_clause(user, alias)
