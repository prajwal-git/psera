allprojects {
    repositories {
        google {
            content {
                excludeGroup("io.flutter")
                excludeGroupByRegex("org\\.jetbrains.*")
            }
        }
        mavenCentral {
            content { excludeGroup("io.flutter") }
        }
        exclusiveContent {
            forRepository {
                maven {
                    name = "FlutterEngine"
                    url = uri("https://storage.googleapis.com/download.flutter.io")
                }
            }
            filter { includeGroup("io.flutter") }
        }
    }
}

val newBuildDir: Directory =
    rootProject.layout.buildDirectory
        .dir("../../build")
        .get()
rootProject.layout.buildDirectory.value(newBuildDir)

subprojects {
    val newSubprojectBuildDir: Directory = newBuildDir.dir(project.name)
    project.layout.buildDirectory.value(newSubprojectBuildDir)
}
subprojects {
    project.evaluationDependsOn(":app")
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}
