# src

These files are located under `src` folder


### Values to replace

1. Values need to be replaced with your own backend

- Under `src/calendar/constants.ts` 

- Under `src/contacts/constants.ts` 

- Under `src/lib/constants.ts`

- Under `src/Screens/Assist/constants.ts`

- S3 bucket under `src/Screens/Profile/UserEditProfile.tsx`

    - There is an aws lambda for image compression to compress images from uncompressed bucket to compressed bucket for image serving

    values to replace include 

    ```
    const bucketNameProfile = 'YOUR S3 COMPRESSED BUCKET NAME'

    const bucketNameProfileUncompressed = 'YOUR S3 UNCOMPRESSED BUCKET NAME'

    const PUBLICPROFILEIMAGEAPI = 'YOUR AWS SERVERLESS IMAGE HANDLER CLOUDFRONT URL'

    const bucketRegion = 'YOUR BUCKET REGION'
    ```

  - S3 bucket under under `src/Screens/Profile/UserProfileCamera.tsx`

  - Use [aws serverless image handler](https://aws.amazon.com/solutions/implementations/serverless-image-handler/) for image resizing for `const PUBLICPROFILEIMAGEAPI`


- Under `src/Screens/Profile/UserViewFollowers.tsx`

- Under `src/Screens/Profile/UserViewFollowing.tsx`
- Under `src/Screens/Profile/UserViewProfile.tsx`

  - Use [aws serverless image handler](https://aws.amazon.com/solutions/implementations/serverless-image-handler/) for image resizing for `const PUBLICIMAGEAPI`
- Under `src/Screens/Post/UserCamera.tsx`
- Under `src/Screens/Post/UserCommentPost.tsx`
- Under `src/Screens/Post/UserViewPost.tsx`
- Under `src/Screens/Settings/Autopilot/constants.ts`
- Under `src/zoom/constants.ts`
- Under `src/dataTypes/configs.ts`
- Please follow instructions provided by [Google](https://support.google.com/cloud/answer/9110914?hl=en#zippy=%2Csteps-to-prepare-for-verification%2Cwhen-does-my-app-have-to-be-verified-by-google%2Cwhat-app-types-are-not-applicable-for-verification) to use OAuth for Google Calendar & People API with iOS and Android
  - Depending on the user size you may have to show a video demonstration of the consent screen
  - You will be able to generate iOS & and Android client Id & redirect url under [Google console](https://support.google.com/cloud/answer/6158849?hl=en&ref_topic=3473162)




