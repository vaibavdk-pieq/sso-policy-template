package orbit.authz

import rego.v1

default allow := false

allow if data.orbit.authz.example.allow
