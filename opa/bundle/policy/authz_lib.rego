package orbit.authz.lib

import rego.v1

# Contract: callers send input.user.agencyId. data.orbit must include allowed_agency_ids.
# Path entries: exact strings, or { "glob": "/path/**" } (OPA glob.match, "/" delimited).

top_level_agency_ok(agency_id) if {
	agency_id in data.orbit.allowed_agency_ids
}

agency_key(id) := k if {
	type_name(id) == "number"
	k := sprintf("%d", [id])
}

agency_key(id) := k if {
	type_name(id) == "string"
	k := id
}

permission_entries(doc, agency_id, role, method) := entries if {
	ak := agency_key(agency_id)
	by_ag := object.get(doc, "by_agency", {})
	role_perms := object.get(object.get(by_ag, ak, {}), role, {})
	entries := object.get(role_perms, method, [])
}

path_allowed(entry, path) if {
	type_name(entry) == "string"
	entry == path
}

path_allowed(entry, path) if {
	type_name(entry) == "object"
	glob.match(entry.glob, ["/"], path)
}
