package orbit.authz.example

import rego.v1

default allow := false

# Data path: data.orbit.example (directory opa/bundle/orbit/example/)

allow if {
	agency_id := input.user.agencyId
	data.orbit.authz.lib.top_level_agency_ok(agency_id)
	role := input.user.role
	method := input.action.method
	path := input.path
	entries := data.orbit.authz.lib.permission_entries(data.orbit.example, agency_id, role, method)
	some entry in entries
	data.orbit.authz.lib.path_allowed(entry, path)
}
