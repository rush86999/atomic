package org.acme.kotlin.schooltimetabling

import io.quarkus.test.common.QuarkusTestResource
import io.quarkus.test.h2.H2DatabaseTestResource


@QuarkusTestResource(H2DatabaseTestResource::class)
class TestResources
