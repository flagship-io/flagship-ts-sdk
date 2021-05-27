class DemoFlagship{
    Flagship.start("bkk4s7gcmjcg07fke9dg", "Q6FDmj6F188nh75lhEato2MwoyXDS7y34VrAL4Aa",
                new FlagshipConfig()
                        .withLogLevel(LogManager.Level.ALL)
                        .withFlagshipMode(Flagship.Mode.BUCKETING)
                        .withBucketingPollingIntervals(20, TimeUnit.SECONDS)
                        .withStatusChangeListener(newStatus -> {
                            flagshipReadyLatch.countDown();
                        })
        );
}