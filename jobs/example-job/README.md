# Example Scheduled Job

This package includes an example Typescript project, which can be scheduled to run at a given time using Kubernetes CronJobs.

## Cron Jobs

This doesn't have to be run as a cron job, however it is designed to be run that way.
The schedule can be modified in the `kube/jobs.yaml` file, like so:

```yaml
--- jobs.yaml ---

spec:
  schedule: "0 */1 * * *" <-- Change the schedule here
```

## Connecting to services

To connect to external services, such as a database or API, put the connection details in a `.env` file in the top folder for this job. On build, this file will automatically be bundled into the Docker image.
