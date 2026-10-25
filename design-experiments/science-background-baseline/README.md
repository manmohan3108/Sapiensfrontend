# Background experiment rollback

The two snapshots here preserve the previous background version. Copy them back
to src/app/components/customer/ScienceBackgroundStudy.tsx and
src/styles/science-background-study.css to undo this revision.

To remove the whole experiment, remove the ScienceBackgroundStudy import and
conditional mount in LandingDirectionsPage.tsx, then delete its component and CSS.
Existing product styles, core and layout are unchanged.
