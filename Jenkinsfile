// Meridian Digital Banking: continuous integration (test and build verification ONLY, never deploys).
// Runs on macOS with Homebrew tools and a local PostgreSQL. No Docker. See docs/JENKINS.md.
pipeline {
  agent any

  parameters {
    string(name: 'JAVA_HOME_21', defaultValue: '/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home', description: 'Path to a Java 21 JDK')
    string(name: 'PG_BIN', defaultValue: '/opt/homebrew/opt/postgresql@15/bin', description: 'Directory containing psql and pg_isready')
    string(name: 'TEST_DB_HOST', defaultValue: 'localhost', description: 'PostgreSQL host for the isolated test database')
    string(name: 'TEST_DB_PORT', defaultValue: '5432', description: 'PostgreSQL port')
    string(name: 'TEST_DB_NAME', defaultValue: 'meridian_test', description: 'Isolated test database. Must end with _test; the development database is never used.')
    booleanParam(name: 'RUN_INTEGRATION_TESTS', defaultValue: true, description: 'Run the PostgreSQL-backed integration tests')
    booleanParam(name: 'CLEAN_WORKSPACE', defaultValue: false, description: 'Delete the workspace after the build')
  }

  options {
    skipDefaultCheckout(true)                                // checkout happens explicitly in the first stage
    timeout(time: 30, unit: 'MINUTES')                       // whole-pipeline limit
    timestamps()
    buildDiscarder(logRotator(numToKeepStr: '20', artifactNumToKeepStr: '10'))
    disableConcurrentBuilds(abortPrevious: true)             // a newer push to the same branch/PR supersedes the older build
  }

  // Webhook trigger for a classic Pipeline job. Multibranch jobs ignore this and are triggered by the GitHub webhook
  // through the GitHub Branch Source plugin (push, pull request, manual "Build Now"). See docs/JENKINS.md.
  triggers { githubPush() }

  environment {
    JAVA_HOME     = "${params.JAVA_HOME_21}"
    PATH          = "${params.JAVA_HOME_21}/bin:/opt/homebrew/bin:${params.PG_BIN}:${env.PATH}"
    CI            = 'true'
    TEST_DB_HOST  = "${params.TEST_DB_HOST}"
    TEST_DB_PORT  = "${params.TEST_DB_PORT}"
    TEST_DB_NAME  = "${params.TEST_DB_NAME}"
    TEST_DB_URL   = "jdbc:postgresql://${params.TEST_DB_HOST}:${params.TEST_DB_PORT}/${params.TEST_DB_NAME}"
    // Jenkins Credentials (Username with password, id 'meridian-test-db'). Exposes TEST_DB_CRED_USR / TEST_DB_CRED_PSW and masks both in the log.
    TEST_DB_CRED  = credentials('meridian-test-db')
  }

  stages {
    stage('Checkout Source') {
      steps {
        checkout scm
        sh 'git log -1 --pretty="Building %h by %an: %s"'
      }
    }

    stage('Environment Validation') {
      options { timeout(time: 2, unit: 'MINUTES') }
      steps {
        // Single-quoted so Groovy never interpolates the secret; the script reads it from the environment only.
        sh '''
          export TEST_DB_USER="$TEST_DB_CRED_USR" TEST_DB_PASSWORD="$TEST_DB_CRED_PSW"
          scripts/ci/validate-environment.sh
        '''
      }
    }

    stage('Install Dependencies') {
      options { timeout(time: 10, unit: 'MINUTES') }
      parallel {
        stage('Maven dependencies') {
          steps {
            dir('backend') { sh 'mvn -B -ntp clean dependency:resolve dependency:resolve-plugins' }
          }
        }
        stage('npm dependencies') {
          steps {
            dir('frontend') {
              sh '''
                rm -rf coverage reports
                if [ -f package-lock.json ]; then
                  npm ci --no-audit --no-fund      # reproducible install; fails if the lockfile is out of sync with package.json
                else
                  echo "No package-lock.json found; falling back to npm install"
                  npm install --no-audit --no-fund
                fi
              '''
            }
          }
        }
      }
    }

    stage('Backend Unit Tests') {
      options { timeout(time: 10, unit: 'MINUTES') }
      steps {
        dir('backend') { sh 'mvn -B -ntp test' }
      }
      post {
        always {
          junit testResults: 'backend/target/surefire-reports/*.xml', allowEmptyResults: false
          sh '''
            mkdir -p ci-reports/backend
            [ -d backend/target/surefire-reports ] && cp -R backend/target/surefire-reports ci-reports/backend/surefire-reports || true
          '''
        }
      }
    }

    stage('Backend Integration Tests') {
      when { expression { params.RUN_INTEGRATION_TESTS } }
      options { timeout(time: 10, unit: 'MINUTES') }
      steps {
        dir('backend') {
          // Runs only the *IT classes (failsafe) against the isolated test database, then the JaCoCo report and 80% gate.
          sh '''
            export TEST_DB_USER="$TEST_DB_CRED_USR" TEST_DB_PASSWORD="$TEST_DB_CRED_PSW"
            mvn -B -ntp verify -Dskip.unit.tests=true
          '''
        }
      }
      post {
        always {
          junit testResults: 'backend/target/failsafe-reports/*.xml', allowEmptyResults: true
          // Keep the reports: the later "mvn clean package" would delete backend/target.
          sh '''
            mkdir -p ci-reports/backend
            [ -d backend/target/site/jacoco ] && cp -R backend/target/site/jacoco ci-reports/backend/jacoco || true
            [ -d backend/target/failsafe-reports ] && cp -R backend/target/failsafe-reports ci-reports/backend/failsafe-reports || true
          '''
        }
      }
    }

    stage('Frontend Tests') {
      options { timeout(time: 10, unit: 'MINUTES') }
      steps {
        dir('frontend') {
          sh 'npm run test:demo'          // existing browser-demo logic tests (node:test)
          sh 'npm run test:coverage'      // Vitest + React Testing Library, with coverage thresholds; writes reports/junit.xml
        }
      }
      post {
        always {
          junit testResults: 'frontend/reports/junit.xml', allowEmptyResults: true
          sh '''
            mkdir -p ci-reports/frontend
            [ -d frontend/coverage ] && cp -R frontend/coverage ci-reports/frontend/coverage || true
            [ -f frontend/reports/junit.xml ] && cp frontend/reports/junit.xml ci-reports/frontend/junit.xml || true
          '''
        }
      }
    }

    stage('TypeScript Validation') {
      options { timeout(time: 5, unit: 'MINUTES') }
      steps { dir('frontend') { sh 'npm run typecheck' } }
    }

    stage('Frontend Build') {
      options { timeout(time: 5, unit: 'MINUTES') }
      steps { dir('frontend') { sh 'npm run build' } }
    }

    stage('Backend Build') {
      options { timeout(time: 10, unit: 'MINUTES') }
      steps {
        dir('backend') {
          // Tests already ran above, so packaging skips them rather than running everything twice.
          sh 'mvn -B -ntp clean package -Dskip.unit.tests=true -Dskip.integration.tests=true -Dskip.coverage.check=true'
          sh '''
            JAR=target/banking-api-1.0.0.jar
            test -s "$JAR" || { echo "Expected $JAR was not produced" >&2; exit 1; }
            LISTING=$(unzip -l "$JAR")
            echo "$LISTING" | grep -q 'BOOT-INF/classes/com/meridian/banking/BankingApplication.class' \
              || { echo "$JAR is not an executable Spring Boot jar" >&2; exit 1; }
            ls -l "$JAR"
          '''
        }
      }
    }

    stage('Publish Reports') {
      steps {
        script {
          // The Coverage plugin is optional; the HTML reports are archived either way.
          try {
            recordCoverage(
              tools: [[parser: 'JACOCO', pattern: 'ci-reports/backend/jacoco/jacoco.xml'],
                      [parser: 'COBERTURA', pattern: 'ci-reports/frontend/coverage/cobertura-coverage.xml']],
              sourceCodeRetention: 'EVERY_BUILD')
          } catch (err) {
            echo "Coverage plugin not available (${err.class.simpleName}); archived HTML reports are still published."
          }
        }
        archiveArtifacts artifacts: 'ci-reports/**, backend/target/banking-api-*.jar, frontend/dist/**', allowEmptyArchive: true, fingerprint: true
      }
    }
  }

  post {
    always {
      // Reports are already published per stage, so they survive a failed build.
      archiveArtifacts artifacts: 'ci-reports/**, frontend/reports/**', allowEmptyArchive: true
    }
    success { echo 'Build verified: all tests passed and both applications built. Nothing was deployed.' }
    failure { echo 'Build FAILED. Open "Test Result" and the stage logs; see docs/JENKINS.md#troubleshooting.' }
    cleanup {
      script { if (params.CLEAN_WORKSPACE) { deleteDir() } }
    }
  }
}
