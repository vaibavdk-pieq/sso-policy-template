package orbit.ui

import rego.v1

default navigation := []

navigation := nav if {
	agency_id := input.user.agencyId
	data.orbit.authz.lib.top_level_agency_ok(agency_id)
	ak := data.orbit.authz.lib.agency_key(agency_id)
	nav := object.get(object.get(data.orbit.ui_navigation_by_agency, ak, {}), input.user.role, [])
}
