/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const syncUserProfiles = /* GraphQL */ `
  query SyncUserProfiles(
    $filter: ModelUserProfileFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncUserProfiles(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        avatar
        name
        email
        followerCount
        followingCount
        postCount
        description
        userId
        sub
        pointId
        dietSettingsId
        mealPreferencesId
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const getUserProfile = /* GraphQL */ `
  query GetUserProfile($id: ID!) {
    getUserProfile(id: $id) {
      id
      avatar
      name
      email
      followerCount
      followingCount
      postCount
      description
      userId
      sub
      Posts {
        nextToken
        startedAt
      }
      pointId
      dietSettingsId
      mealPreferencesId
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      owner
    }
  }
`;
export const listUserProfiles = /* GraphQL */ `
  query ListUserProfiles(
    $filter: ModelUserProfileFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listUserProfiles(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        avatar
        name
        email
        followerCount
        followingCount
        postCount
        description
        userId
        sub
        pointId
        dietSettingsId
        mealPreferencesId
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const syncFollowers = /* GraphQL */ `
  query SyncFollowers(
    $filter: ModelFollowerFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncFollowers(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        userId
        followerProfileId
        avatar
        name
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const getFollower = /* GraphQL */ `
  query GetFollower($userId: ID!, $followerProfileId: ID!) {
    getFollower(userId: $userId, followerProfileId: $followerProfileId) {
      id
      userId
      followerProfileId
      avatar
      name
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      owner
    }
  }
`;
export const listFollowers = /* GraphQL */ `
  query ListFollowers(
    $userId: ID
    $followerProfileId: ModelIDKeyConditionInput
    $filter: ModelFollowerFilterInput
    $limit: Int
    $nextToken: String
    $sortDirection: ModelSortDirection
  ) {
    listFollowers(
      userId: $userId
      followerProfileId: $followerProfileId
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      sortDirection: $sortDirection
    ) {
      items {
        id
        userId
        followerProfileId
        avatar
        name
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const syncFollowings = /* GraphQL */ `
  query SyncFollowings(
    $filter: ModelFollowingFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncFollowings(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        userId
        followingProfileId
        name
        avatar
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const getFollowing = /* GraphQL */ `
  query GetFollowing($id: ID!) {
    getFollowing(id: $id) {
      id
      userId
      followingProfileId
      name
      avatar
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      owner
    }
  }
`;
export const listFollowings = /* GraphQL */ `
  query ListFollowings(
    $filter: ModelFollowingFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listFollowings(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        userId
        followingProfileId
        name
        avatar
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const syncArticles = /* GraphQL */ `
  query SyncArticles(
    $filter: ModelArticleFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncArticles(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        dateDay
        date
        postId
        likeCount
        commentCount
        image
        caption
        userId
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
      }
      nextToken
      startedAt
    }
  }
`;
export const getArticle = /* GraphQL */ `
  query GetArticle($id: ID!) {
    getArticle(id: $id) {
      id
      dateDay
      date
      postId
      tags {
        nextToken
        startedAt
      }
      likes {
        nextToken
        startedAt
      }
      likeCount
      commentCount
      image
      caption
      userId
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
    }
  }
`;
export const listArticles = /* GraphQL */ `
  query ListArticles(
    $filter: ModelArticleFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listArticles(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        dateDay
        date
        postId
        likeCount
        commentCount
        image
        caption
        userId
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
      }
      nextToken
      startedAt
    }
  }
`;
export const syncPosts = /* GraphQL */ `
  query SyncPosts(
    $filter: ModelPostFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncPosts(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        date
        caption
        image
        userId
        likeCount
        commentCount
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const getPost = /* GraphQL */ `
  query GetPost($id: ID!) {
    getPost(id: $id) {
      id
      date
      caption
      tags {
        nextToken
        startedAt
      }
      image
      userId
      likes {
        nextToken
        startedAt
      }
      likeCount
      commentCount
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      owner
    }
  }
`;
export const listPosts = /* GraphQL */ `
  query ListPosts(
    $filter: ModelPostFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listPosts(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        date
        caption
        image
        userId
        likeCount
        commentCount
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const syncArticleTags = /* GraphQL */ `
  query SyncArticleTags(
    $filter: ModelArticleTagFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncArticleTags(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        postId
        articleId
        tagId
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
      }
      nextToken
      startedAt
    }
  }
`;
export const syncTags = /* GraphQL */ `
  query SyncTags(
    $filter: ModelTagFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncTags(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        name
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
      }
      nextToken
      startedAt
    }
  }
`;
export const getTag = /* GraphQL */ `
  query GetTag($id: ID!) {
    getTag(id: $id) {
      id
      articles {
        nextToken
        startedAt
      }
      name
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
    }
  }
`;
export const listTags = /* GraphQL */ `
  query ListTags(
    $filter: ModelTagFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listTags(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        name
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
      }
      nextToken
      startedAt
    }
  }
`;
export const syncComments = /* GraphQL */ `
  query SyncComments(
    $filter: ModelCommentFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncComments(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        postId
        content
        replyId
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const getComment = /* GraphQL */ `
  query GetComment($id: ID!) {
    getComment(id: $id) {
      id
      postId
      content
      replyId
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      owner
    }
  }
`;
export const listComments = /* GraphQL */ `
  query ListComments(
    $filter: ModelCommentFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listComments(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        postId
        content
        replyId
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const syncPostLikes = /* GraphQL */ `
  query SyncPostLikes(
    $filter: ModelPostLikeFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncPostLikes(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        postId
        userId
        name
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const getPostLike = /* GraphQL */ `
  query GetPostLike($id: ID!) {
    getPostLike(id: $id) {
      id
      postId
      userId
      name
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      owner
    }
  }
`;
export const listPostLikes = /* GraphQL */ `
  query ListPostLikes(
    $filter: ModelPostLikeFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listPostLikes(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        postId
        userId
        name
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const syncPointSystems = /* GraphQL */ `
  query SyncPointSystems(
    $filter: ModelPointSystemFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncPointSystems(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        type
        action
        point
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const getPointSystem = /* GraphQL */ `
  query GetPointSystem($id: ID!) {
    getPointSystem(id: $id) {
      id
      type
      action
      point
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      owner
    }
  }
`;
export const listPointSystems = /* GraphQL */ `
  query ListPointSystems(
    $filter: ModelPointSystemFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listPointSystems(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        type
        action
        point
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const syncUsers = /* GraphQL */ `
  query SyncUsers(
    $filter: ModelUserFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncUsers(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        profileId
        sub
        email
        phoneNumber
        name
        customerId
        timezone
        onboard
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const getUser = /* GraphQL */ `
  query GetUser($id: ID!) {
    getUser(id: $id) {
      id
      profileId
      sub
      email
      phoneNumber
      name
      customerId
      timezone
      onboard
      paymentCards {
        cardId
        cardBrand
        bin
        preferred
      }
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      owner
    }
  }
`;
export const listUsers = /* GraphQL */ `
  query ListUsers(
    $filter: ModelUserFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listUsers(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        profileId
        sub
        email
        phoneNumber
        name
        customerId
        timezone
        onboard
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const syncSettings = /* GraphQL */ `
  query SyncSettings(
    $filter: ModelSettingsFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncSettings(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        sub
        calories
        carbs
        fat
        sodium
        glycemicIndex
        carbsInGrams
        SMSCoachReminder
        pushCoachReminder
        emailCoachReminder
        followerNotification
        likeNotification
        pushRecipeReminder
        emailRecipeReminder
        followPostNotification
        showEmail
        showName
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const getSettings = /* GraphQL */ `
  query GetSettings($id: ID!) {
    getSettings(id: $id) {
      id
      sub
      calories
      carbs
      fat
      sodium
      glycemicIndex
      carbsInGrams
      SMSCoachReminder
      pushCoachReminder
      emailCoachReminder
      followerNotification
      likeNotification
      pushRecipeReminder
      emailRecipeReminder
      followPostNotification
      showEmail
      showName
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      owner
    }
  }
`;
export const listSettingss = /* GraphQL */ `
  query ListSettingss(
    $filter: ModelSettingsFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listSettingss(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        sub
        calories
        carbs
        fat
        sodium
        glycemicIndex
        carbsInGrams
        SMSCoachReminder
        pushCoachReminder
        emailCoachReminder
        followerNotification
        likeNotification
        pushRecipeReminder
        emailRecipeReminder
        followPostNotification
        showEmail
        showName
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const syncMealPreferences = /* GraphQL */ `
  query SyncMealPreferences(
    $filter: ModelMealPreferencesFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncMealPreferences(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        sub
        cuisineType
        diet
        health
        caloriesRange
        excludeFoods
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const getMealPreferences = /* GraphQL */ `
  query GetMealPreferences($id: ID!) {
    getMealPreferences(id: $id) {
      id
      sub
      cuisineType
      diet
      health
      caloriesRange
      excludeFoods
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      owner
    }
  }
`;
export const listMealPreferencess = /* GraphQL */ `
  query ListMealPreferencess(
    $filter: ModelMealPreferencesFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listMealPreferencess(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        sub
        cuisineType
        diet
        health
        caloriesRange
        excludeFoods
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const syncNotifications = /* GraphQL */ `
  query SyncNotifications(
    $filter: ModelNotificationsFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncNotifications(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        sub
        message
        receiverId
        senderId
        date
        system
        sms
        email
        push
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
      }
      nextToken
      startedAt
    }
  }
`;
export const getNotifications = /* GraphQL */ `
  query GetNotifications($id: ID!) {
    getNotifications(id: $id) {
      id
      sub
      message
      receiverId
      senderId
      date
      system
      sms
      email
      push
      ttl
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
    }
  }
`;
export const listNotificationss = /* GraphQL */ `
  query ListNotificationss(
    $filter: ModelNotificationsFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listNotificationss(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        sub
        message
        receiverId
        senderId
        date
        system
        sms
        email
        push
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
      }
      nextToken
      startedAt
    }
  }
`;
export const syncPlans = /* GraphQL */ `
  query SyncPlans(
    $filter: ModelPlanFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncPlans(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        planNumber
        planName
        description
        amount
        recur
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const getPlan = /* GraphQL */ `
  query GetPlan($id: ID!) {
    getPlan(id: $id) {
      id
      planNumber
      planName
      description
      amount
      recur
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      owner
    }
  }
`;
export const listPlans = /* GraphQL */ `
  query ListPlans(
    $filter: ModelPlanFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listPlans(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        planNumber
        planName
        description
        amount
        recur
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const syncRecipeFavorites = /* GraphQL */ `
  query SyncRecipeFavorites(
    $filter: ModelRecipeFavoriteFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncRecipeFavorites(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        userId
        date
        mealPlanId
        recipeId
        meal
        yield
        name
        image
        calories
        dietLabels
        healthLabels
        source
        totalNutrients
        totalDaily
        url
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const getRecipeFavorite = /* GraphQL */ `
  query GetRecipeFavorite($id: ID!) {
    getRecipeFavorite(id: $id) {
      id
      userId
      date
      mealPlanId
      recipeId
      meal
      yield
      name
      image
      calories
      dietLabels
      healthLabels
      ingredients {
        foodId
        quantity
        measure
        weight
        foodLabel
        foodCategory
      }
      source
      totalNutrients
      totalDaily
      url
      ttl
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      owner
    }
  }
`;
export const listRecipeFavorites = /* GraphQL */ `
  query ListRecipeFavorites(
    $filter: ModelRecipeFavoriteFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listRecipeFavorites(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        userId
        date
        mealPlanId
        recipeId
        meal
        yield
        name
        image
        calories
        dietLabels
        healthLabels
        source
        totalNutrients
        totalDaily
        url
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const syncFavoriteMeals = /* GraphQL */ `
  query SyncFavoriteMeals(
    $filter: ModelFavoriteMealFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncFavoriteMeals(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        foodId
        userId
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const getFavoriteMeal = /* GraphQL */ `
  query GetFavoriteMeal($id: ID!) {
    getFavoriteMeal(id: $id) {
      id
      foodId
      userId
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      owner
    }
  }
`;
export const listFavoriteMeals = /* GraphQL */ `
  query ListFavoriteMeals(
    $filter: ModelFavoriteMealFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listFavoriteMeals(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        foodId
        userId
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const syncUserMealLoggers = /* GraphQL */ `
  query SyncUserMealLoggers(
    $filter: ModelUserMealLoggerFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncUserMealLoggers(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        date
        userId
        image
        type
        carbs
        carbsInGrams
        fat
        fatInGrams
        protein
        proteinInGrams
        calories
        sodium
        glycemicIndex
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const getUserMealLogger = /* GraphQL */ `
  query GetUserMealLogger($id: ID!) {
    getUserMealLogger(id: $id) {
      id
      date
      userId
      image
      type
      carbs
      carbsInGrams
      fat
      fatInGrams
      protein
      proteinInGrams
      calories
      sodium
      glycemicIndex
      ttl
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      owner
    }
  }
`;
export const listUserMealLoggers = /* GraphQL */ `
  query ListUserMealLoggers(
    $filter: ModelUserMealLoggerFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listUserMealLoggers(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        date
        userId
        image
        type
        carbs
        carbsInGrams
        fat
        fatInGrams
        protein
        proteinInGrams
        calories
        sodium
        glycemicIndex
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const syncMemberships = /* GraphQL */ `
  query SyncMemberships(
    $filter: ModelMembershipFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncMemberships(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        startDate
        customerId
        userId
        amount
        currentPeriodEnd
        actualEndDate
        refundAmount
        autoRenew
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
      }
      nextToken
      startedAt
    }
  }
`;
export const getMembership = /* GraphQL */ `
  query GetMembership($id: ID!) {
    getMembership(id: $id) {
      id
      startDate
      customerId
      userId
      amount
      currentPeriodEnd
      actualEndDate
      refundAmount
      autoRenew
      user {
        id
        profileId
        sub
        email
        phoneNumber
        name
        customerId
        timezone
        onboard
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      ttl
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
    }
  }
`;
export const listMemberships = /* GraphQL */ `
  query ListMemberships(
    $filter: ModelMembershipFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listMemberships(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        startDate
        customerId
        userId
        amount
        currentPeriodEnd
        actualEndDate
        refundAmount
        autoRenew
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
      }
      nextToken
      startedAt
    }
  }
`;
export const syncactive_subscriptions = /* GraphQL */ `
  query Syncactive_subscriptions(
    $filter: Modelactive_subscriptionFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncactive_subscriptions(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        startDate
        customerId
        userId
        amount
        currentPeriodEnd
        autoRenew
        refunded
        isReviewed
        timezone
        planId
        description
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
      }
      nextToken
      startedAt
    }
  }
`;
export const getactive_subscription = /* GraphQL */ `
  query Getactive_subscription($id: ID!) {
    getactive_subscription(id: $id) {
      id
      startDate
      customerId
      userId
      amount
      currentPeriodEnd
      autoRenew
      refunded
      isReviewed
      timezone
      planId
      description
      ttl
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
    }
  }
`;
export const listactive_subscriptions = /* GraphQL */ `
  query Listactive_subscriptions(
    $filter: Modelactive_subscriptionFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listactive_subscriptions(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        startDate
        customerId
        userId
        amount
        currentPeriodEnd
        autoRenew
        refunded
        isReviewed
        timezone
        planId
        description
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
      }
      nextToken
      startedAt
    }
  }
`;
export const syncPaidSubscriptions = /* GraphQL */ `
  query SyncPaidSubscriptions(
    $filter: ModelPaidSubscriptionFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncPaidSubscriptions(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        startDate
        customerId
        userId
        amount
        currentPeriodEnd
        actualEndDate
        refundAmount
        autoRenew
        timezone
        planId
        description
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
      }
      nextToken
      startedAt
    }
  }
`;
export const getPaidSubscription = /* GraphQL */ `
  query GetPaidSubscription($id: ID!) {
    getPaidSubscription(id: $id) {
      id
      startDate
      customerId
      userId
      amount
      currentPeriodEnd
      actualEndDate
      refundAmount
      autoRenew
      timezone
      planId
      description
      user {
        id
        profileId
        sub
        email
        phoneNumber
        name
        customerId
        timezone
        onboard
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      ttl
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
    }
  }
`;
export const listPaidSubscriptions = /* GraphQL */ `
  query ListPaidSubscriptions(
    $filter: ModelPaidSubscriptionFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listPaidSubscriptions(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        startDate
        customerId
        userId
        amount
        currentPeriodEnd
        actualEndDate
        refundAmount
        autoRenew
        timezone
        planId
        description
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
      }
      nextToken
      startedAt
    }
  }
`;
export const syncUserTransactions = /* GraphQL */ `
  query SyncUserTransactions(
    $filter: ModelUserTransactionFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncUserTransactions(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        date
        userId
        ttl
        amount
        refundAmount
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
      }
      nextToken
      startedAt
    }
  }
`;
export const getUserTransaction = /* GraphQL */ `
  query GetUserTransaction($id: ID!) {
    getUserTransaction(id: $id) {
      id
      date
      userId
      ttl
      amount
      refundAmount
      user {
        id
        profileId
        sub
        email
        phoneNumber
        name
        customerId
        timezone
        onboard
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
    }
  }
`;
export const listUserTransactions = /* GraphQL */ `
  query ListUserTransactions(
    $filter: ModelUserTransactionFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listUserTransactions(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        date
        userId
        ttl
        amount
        refundAmount
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
      }
      nextToken
      startedAt
    }
  }
`;
export const syncSavedRecipeSearches = /* GraphQL */ `
  query SyncSavedRecipeSearches(
    $filter: ModelSavedRecipeSearchFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncSavedRecipeSearches(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        mealPlanId
        meal
        goalId
        userId
        from
        to
        usedTill
        count
        more
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const getSavedRecipeSearch = /* GraphQL */ `
  query GetSavedRecipeSearch($id: ID!) {
    getSavedRecipeSearch(id: $id) {
      id
      mealPlanId
      meal
      goalId
      userId
      from
      to
      usedTill
      count
      more
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      owner
    }
  }
`;
export const listSavedRecipeSearchs = /* GraphQL */ `
  query ListSavedRecipeSearchs(
    $filter: ModelSavedRecipeSearchFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listSavedRecipeSearchs(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        mealPlanId
        meal
        goalId
        userId
        from
        to
        usedTill
        count
        more
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const syncShoppingLists = /* GraphQL */ `
  query SyncShoppingLists(
    $filter: ModelShoppingListFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncShoppingLists(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        userId
        date
        recipeId
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const getShoppingList = /* GraphQL */ `
  query GetShoppingList($id: ID!) {
    getShoppingList(id: $id) {
      id
      userId
      date
      recipeId
      ingredients {
        foodId
        quantity
        measure
        weight
        foodLabel
        foodCategory
      }
      ttl
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      owner
    }
  }
`;
export const listShoppingLists = /* GraphQL */ `
  query ListShoppingLists(
    $filter: ModelShoppingListFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listShoppingLists(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        userId
        date
        recipeId
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const syncRecipes = /* GraphQL */ `
  query SyncRecipes(
    $filter: ModelRecipeFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncRecipes(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        userId
        mealPlanId
        recipeId
        goalId
        date
        meal
        yield
        name
        image
        calories
        dietLabels
        healthLabels
        source
        totalNutrients
        totalDaily
        url
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const getRecipe = /* GraphQL */ `
  query GetRecipe($id: ID!) {
    getRecipe(id: $id) {
      id
      userId
      mealPlanId
      recipeId
      goalId
      date
      meal
      yield
      name
      image
      calories
      dietLabels
      healthLabels
      ingredients {
        foodId
        quantity
        measure
        weight
        foodLabel
        foodCategory
      }
      source
      totalNutrients
      totalDaily
      url
      ttl
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      owner
    }
  }
`;
export const listRecipes = /* GraphQL */ `
  query ListRecipes(
    $filter: ModelRecipeFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listRecipes(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        userId
        mealPlanId
        recipeId
        goalId
        date
        meal
        yield
        name
        image
        calories
        dietLabels
        healthLabels
        source
        totalNutrients
        totalDaily
        url
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const syncSchedules = /* GraphQL */ `
  query SyncSchedules(
    $filter: ModelScheduleFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncSchedules(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        primaryGoalType
        secondaryGoalType
        status
        userId
        date
        unit
        rate
        frequency
        startDate
        endDate
        byWeekDay
        reminder
        reminderTimeRange
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const getSchedule = /* GraphQL */ `
  query GetSchedule($id: ID!) {
    getSchedule(id: $id) {
      id
      primaryGoalType
      secondaryGoalType
      status
      userId
      date
      unit
      rate
      frequency
      startDate
      endDate
      byWeekDay
      reminder
      reminderTimeRange
      ttl
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      owner
    }
  }
`;
export const listSchedules = /* GraphQL */ `
  query ListSchedules(
    $filter: ModelScheduleFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listSchedules(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        primaryGoalType
        secondaryGoalType
        status
        userId
        date
        unit
        rate
        frequency
        startDate
        endDate
        byWeekDay
        reminder
        reminderTimeRange
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const syncStreaks = /* GraphQL */ `
  query SyncStreaks(
    $filter: ModelStreakFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncStreaks(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        dataType
        goalId
        streak
        startDate
        endDate
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        trainerId
      }
      nextToken
      startedAt
    }
  }
`;
export const getStreak = /* GraphQL */ `
  query GetStreak($id: ID!) {
    getStreak(id: $id) {
      id
      dataType
      goalId
      streak
      startDate
      endDate
      ttl
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      trainerId
    }
  }
`;
export const listStreaks = /* GraphQL */ `
  query ListStreaks(
    $filter: ModelStreakFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listStreaks(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        dataType
        goalId
        streak
        startDate
        endDate
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        trainerId
      }
      nextToken
      startedAt
    }
  }
`;
export const syncRecipeDatabases = /* GraphQL */ `
  query SyncRecipeDatabases(
    $filter: ModelRecipeDatabaseFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncRecipeDatabases(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        meal
        name
        image
        yield
        calories
        dietLabels
        healthLabels
        source
        totalNutrients
        totalDaily
        url
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const getRecipeDatabase = /* GraphQL */ `
  query GetRecipeDatabase($id: ID!) {
    getRecipeDatabase(id: $id) {
      id
      meal
      name
      image
      yield
      calories
      dietLabels
      healthLabels
      ingredients {
        foodId
        quantity
        measure
        weight
        foodLabel
        foodCategory
      }
      source
      totalNutrients
      totalDaily
      url
      ttl
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      owner
    }
  }
`;
export const listRecipeDatabases = /* GraphQL */ `
  query ListRecipeDatabases(
    $filter: ModelRecipeDatabaseFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listRecipeDatabases(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        meal
        name
        image
        yield
        calories
        dietLabels
        healthLabels
        source
        totalNutrients
        totalDaily
        url
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const syncMealPlans = /* GraphQL */ `
  query SyncMealPlans(
    $filter: ModelMealPlanFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncMealPlans(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        name
        duration
        diet
        health
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
      }
      nextToken
      startedAt
    }
  }
`;
export const getMealPlan = /* GraphQL */ `
  query GetMealPlan($id: ID!) {
    getMealPlan(id: $id) {
      id
      name
      duration
      diet
      health
      ttl
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
    }
  }
`;
export const listMealPlans = /* GraphQL */ `
  query ListMealPlans(
    $filter: ModelMealPlanFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listMealPlans(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        name
        duration
        diet
        health
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
      }
      nextToken
      startedAt
    }
  }
`;
export const syncGoals = /* GraphQL */ `
  query SyncGoals(
    $filter: ModelGoalFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncGoals(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        userId
        date
        status
        endDate
        primaryGoalType
        secondaryGoalType
        scheduleId
        goal
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const getGoal = /* GraphQL */ `
  query GetGoal($id: ID!) {
    getGoal(id: $id) {
      id
      userId
      date
      status
      endDate
      primaryGoalType
      secondaryGoalType
      scheduleId
      goal
      ttl
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      owner
    }
  }
`;
export const listGoals = /* GraphQL */ `
  query ListGoals(
    $filter: ModelGoalFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listGoals(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        userId
        date
        status
        endDate
        primaryGoalType
        secondaryGoalType
        scheduleId
        goal
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const syncGoalExercises = /* GraphQL */ `
  query SyncGoalExercises(
    $filter: ModelGoalExerciseFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncGoalExercises(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        userId
        date
        status
        endDate
        primaryGoalType
        secondaryGoalType
        scheduleId
        goal
        goalUnit
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const getGoalExercise = /* GraphQL */ `
  query GetGoalExercise($id: ID!) {
    getGoalExercise(id: $id) {
      id
      userId
      date
      status
      endDate
      primaryGoalType
      secondaryGoalType
      scheduleId
      goal
      goalUnit
      ttl
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      owner
    }
  }
`;
export const listGoalExercises = /* GraphQL */ `
  query ListGoalExercises(
    $filter: ModelGoalExerciseFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listGoalExercises(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        userId
        date
        status
        endDate
        primaryGoalType
        secondaryGoalType
        scheduleId
        goal
        goalUnit
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const syncBackgroundTasks = /* GraphQL */ `
  query SyncBackgroundTasks(
    $filter: ModelBackgroundTaskFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncBackgroundTasks(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        userId
        lastSync
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const getBackgroundTask = /* GraphQL */ `
  query GetBackgroundTask($id: ID!) {
    getBackgroundTask(id: $id) {
      id
      userId
      lastSync
      ttl
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      owner
    }
  }
`;
export const listBackgroundTasks = /* GraphQL */ `
  query ListBackgroundTasks(
    $filter: ModelBackgroundTaskFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listBackgroundTasks(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        userId
        lastSync
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const syncBackgroundTimers = /* GraphQL */ `
  query SyncBackgroundTimers(
    $filter: ModelBackgroundTimerFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncBackgroundTimers(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        userId
        primaryGoalType
        secondaryGoalType
        startTime
        endTime
        breakEpisode
        breakStartTime
        breakTimeDuration
        numberOfBreakEpisodes
        isBreak
        workEpisode
        workStartTime
        workTimeDuration
        numberOfWorkEpisodes
        totalActiveTime
        accumulatedDuration
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const getBackgroundTimer = /* GraphQL */ `
  query GetBackgroundTimer($id: ID!) {
    getBackgroundTimer(id: $id) {
      id
      userId
      primaryGoalType
      secondaryGoalType
      startTime
      endTime
      breakEpisode
      breakStartTime
      breakTimeDuration
      numberOfBreakEpisodes
      isBreak
      workEpisode
      workStartTime
      workTimeDuration
      numberOfWorkEpisodes
      totalActiveTime
      accumulatedDuration
      ttl
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      owner
    }
  }
`;
export const listBackgroundTimers = /* GraphQL */ `
  query ListBackgroundTimers(
    $filter: ModelBackgroundTimerFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listBackgroundTimers(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        userId
        primaryGoalType
        secondaryGoalType
        startTime
        endTime
        breakEpisode
        breakStartTime
        breakTimeDuration
        numberOfBreakEpisodes
        isBreak
        workEpisode
        workStartTime
        workTimeDuration
        numberOfWorkEpisodes
        totalActiveTime
        accumulatedDuration
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const syncFruitData = /* GraphQL */ `
  query SyncFruitData(
    $filter: ModelFruitDataFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncFruitData(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        date
        userId
        servings
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const getFruitData = /* GraphQL */ `
  query GetFruitData($id: ID!) {
    getFruitData(id: $id) {
      id
      date
      userId
      servings
      ttl
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      owner
    }
  }
`;
export const listFruitDatas = /* GraphQL */ `
  query ListFruitDatas(
    $filter: ModelFruitDataFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listFruitDatas(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        date
        userId
        servings
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const syncVegetableData = /* GraphQL */ `
  query SyncVegetableData(
    $filter: ModelVegetableDataFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncVegetableData(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        date
        userId
        servings
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const getVegetableData = /* GraphQL */ `
  query GetVegetableData($id: ID!) {
    getVegetableData(id: $id) {
      id
      date
      userId
      servings
      ttl
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      owner
    }
  }
`;
export const listVegetableDatas = /* GraphQL */ `
  query ListVegetableDatas(
    $filter: ModelVegetableDataFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listVegetableDatas(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        date
        userId
        servings
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const syncStepData = /* GraphQL */ `
  query SyncStepData(
    $filter: ModelStepDataFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncStepData(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        date
        userId
        steps
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const getStepData = /* GraphQL */ `
  query GetStepData($id: ID!) {
    getStepData(id: $id) {
      id
      date
      userId
      steps
      ttl
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      owner
    }
  }
`;
export const listStepDatas = /* GraphQL */ `
  query ListStepDatas(
    $filter: ModelStepDataFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listStepDatas(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        date
        userId
        steps
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const syncStrengthData = /* GraphQL */ `
  query SyncStrengthData(
    $filter: ModelStrengthDataFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncStrengthData(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        userId
        type
        userIdType
        date
        weight
        reps
        scheduleId
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const getStrengthData = /* GraphQL */ `
  query GetStrengthData($id: ID!) {
    getStrengthData(id: $id) {
      id
      userId
      type
      userIdType
      date
      weight
      reps
      scheduleId
      ttl
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      owner
    }
  }
`;
export const listStrengthDatas = /* GraphQL */ `
  query ListStrengthDatas(
    $filter: ModelStrengthDataFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listStrengthDatas(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        userId
        type
        userIdType
        date
        weight
        reps
        scheduleId
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const syncEnduranceData = /* GraphQL */ `
  query SyncEnduranceData(
    $filter: ModelEnduranceDataFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncEnduranceData(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        date
        userId
        minutes
        reps
        type
        distance
        userIdType
        scheduleId
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const getEnduranceData = /* GraphQL */ `
  query GetEnduranceData($id: ID!) {
    getEnduranceData(id: $id) {
      id
      date
      userId
      minutes
      reps
      type
      distance
      userIdType
      scheduleId
      ttl
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      owner
    }
  }
`;
export const listEnduranceDatas = /* GraphQL */ `
  query ListEnduranceDatas(
    $filter: ModelEnduranceDataFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listEnduranceDatas(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        date
        userId
        minutes
        reps
        type
        distance
        userIdType
        scheduleId
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const syncGenericExerciseData = /* GraphQL */ `
  query SyncGenericExerciseData(
    $filter: ModelGenericExerciseDataFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncGenericExerciseData(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        date
        userId
        minutes
        scheduleId
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const getGenericExerciseData = /* GraphQL */ `
  query GetGenericExerciseData($id: ID!) {
    getGenericExerciseData(id: $id) {
      id
      date
      userId
      minutes
      scheduleId
      ttl
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      owner
    }
  }
`;
export const listGenericExerciseDatas = /* GraphQL */ `
  query ListGenericExerciseDatas(
    $filter: ModelGenericExerciseDataFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listGenericExerciseDatas(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        date
        userId
        minutes
        scheduleId
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const syncWaterData = /* GraphQL */ `
  query SyncWaterData(
    $filter: ModelWaterDataFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncWaterData(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        date
        userId
        water
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const getWaterData = /* GraphQL */ `
  query GetWaterData($id: ID!) {
    getWaterData(id: $id) {
      id
      date
      userId
      water
      ttl
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      owner
    }
  }
`;
export const listWaterDatas = /* GraphQL */ `
  query ListWaterDatas(
    $filter: ModelWaterDataFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listWaterDatas(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        date
        userId
        water
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const syncWeightData = /* GraphQL */ `
  query SyncWeightData(
    $filter: ModelWeightDataFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncWeightData(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        date
        userId
        weight
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const getWeightData = /* GraphQL */ `
  query GetWeightData($id: ID!) {
    getWeightData(id: $id) {
      id
      date
      userId
      weight
      ttl
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      owner
    }
  }
`;
export const listWeightDatas = /* GraphQL */ `
  query ListWeightDatas(
    $filter: ModelWeightDataFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listWeightDatas(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        date
        userId
        weight
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const syncNewSkillTypeData = /* GraphQL */ `
  query SyncNewSkillTypeData(
    $filter: ModelNewSkillTypeDataFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncNewSkillTypeData(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        date
        userId
        minutes
        type
        userIdType
        scheduleId
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const getNewSkillTypeData = /* GraphQL */ `
  query GetNewSkillTypeData($id: ID!) {
    getNewSkillTypeData(id: $id) {
      id
      date
      userId
      minutes
      type
      userIdType
      scheduleId
      ttl
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      owner
    }
  }
`;
export const listNewSkillTypeDatas = /* GraphQL */ `
  query ListNewSkillTypeDatas(
    $filter: ModelNewSkillTypeDataFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listNewSkillTypeDatas(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        date
        userId
        minutes
        type
        userIdType
        scheduleId
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const syncHabitTypeData = /* GraphQL */ `
  query SyncHabitTypeData(
    $filter: ModelHabitTypeDataFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncHabitTypeData(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        date
        userId
        minutes
        type
        userIdType
        scheduleId
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const getHabitTypeData = /* GraphQL */ `
  query GetHabitTypeData($id: ID!) {
    getHabitTypeData(id: $id) {
      id
      date
      userId
      minutes
      type
      userIdType
      scheduleId
      ttl
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      owner
    }
  }
`;
export const listHabitTypeDatas = /* GraphQL */ `
  query ListHabitTypeDatas(
    $filter: ModelHabitTypeDataFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listHabitTypeDatas(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        date
        userId
        minutes
        type
        userIdType
        scheduleId
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const syncSleepData = /* GraphQL */ `
  query SyncSleepData(
    $filter: ModelSleepDataFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncSleepData(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        date
        userId
        hours
        scheduleId
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const getSleepData = /* GraphQL */ `
  query GetSleepData($id: ID!) {
    getSleepData(id: $id) {
      id
      date
      userId
      hours
      scheduleId
      ttl
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      owner
    }
  }
`;
export const listSleepDatas = /* GraphQL */ `
  query ListSleepDatas(
    $filter: ModelSleepDataFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listSleepDatas(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        date
        userId
        hours
        scheduleId
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const syncMeditationData = /* GraphQL */ `
  query SyncMeditationData(
    $filter: ModelMeditationDataFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncMeditationData(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        date
        userId
        minutes
        scheduleId
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const getMeditationData = /* GraphQL */ `
  query GetMeditationData($id: ID!) {
    getMeditationData(id: $id) {
      id
      date
      userId
      minutes
      scheduleId
      ttl
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      owner
    }
  }
`;
export const listMeditationDatas = /* GraphQL */ `
  query ListMeditationDatas(
    $filter: ModelMeditationDataFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listMeditationDatas(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        date
        userId
        minutes
        scheduleId
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const syncWaistData = /* GraphQL */ `
  query SyncWaistData(
    $filter: ModelWaistDataFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncWaistData(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        date
        userId
        inches
        scheduleId
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const getWaistData = /* GraphQL */ `
  query GetWaistData($id: ID!) {
    getWaistData(id: $id) {
      id
      date
      userId
      inches
      scheduleId
      ttl
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      owner
    }
  }
`;
export const listWaistDatas = /* GraphQL */ `
  query ListWaistDatas(
    $filter: ModelWaistDataFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listWaistDatas(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        date
        userId
        inches
        scheduleId
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const syncUserFoodLoggers = /* GraphQL */ `
  query SyncUserFoodLoggers(
    $filter: ModelUserFoodLoggerFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncUserFoodLoggers(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        userId
        date
        foodId
        mealId
        image
        name
        sodium
        glycemicIndex
        protein
        proteinInGrams
        carbsInGrams
        carbs
        fat
        fatInGrams
        calories
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const getUserFoodLogger = /* GraphQL */ `
  query GetUserFoodLogger($id: ID!) {
    getUserFoodLogger(id: $id) {
      id
      userId
      date
      foodId
      mealId
      image
      name
      sodium
      glycemicIndex
      protein
      proteinInGrams
      carbsInGrams
      carbs
      fat
      fatInGrams
      calories
      ttl
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      owner
    }
  }
`;
export const listUserFoodLoggers = /* GraphQL */ `
  query ListUserFoodLoggers(
    $filter: ModelUserFoodLoggerFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listUserFoodLoggers(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        userId
        date
        foodId
        mealId
        image
        name
        sodium
        glycemicIndex
        protein
        proteinInGrams
        carbsInGrams
        carbs
        fat
        fatInGrams
        calories
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const syncLevels = /* GraphQL */ `
  query SyncLevels(
    $filter: ModelLevelFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncLevels(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        userId
        level
        attempts
        primaryGoalType
        secondaryGoalType
        date
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const getLevel = /* GraphQL */ `
  query GetLevel($id: ID!) {
    getLevel(id: $id) {
      id
      userId
      level
      attempts
      primaryGoalType
      secondaryGoalType
      date
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      owner
    }
  }
`;
export const listLevels = /* GraphQL */ `
  query ListLevels(
    $filter: ModelLevelFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listLevels(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        userId
        level
        attempts
        primaryGoalType
        secondaryGoalType
        date
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const syncLevelSystems = /* GraphQL */ `
  query SyncLevelSystems(
    $filter: ModelLevelSystemFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncLevelSystems(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        level
        scheduleWeekLength
        allowedAttempts
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const getLevelSystem = /* GraphQL */ `
  query GetLevelSystem($id: ID!) {
    getLevelSystem(id: $id) {
      id
      level
      scheduleWeekLength
      allowedAttempts
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      owner
    }
  }
`;
export const listLevelSystems = /* GraphQL */ `
  query ListLevelSystems(
    $filter: ModelLevelSystemFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listLevelSystems(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        level
        scheduleWeekLength
        allowedAttempts
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const syncPoints = /* GraphQL */ `
  query SyncPoints(
    $filter: ModelPointFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncPoints(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        points
        currentPoints
        max
        min
        maxDate
        minDate
        currentDate
        dayCount
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const getPoint = /* GraphQL */ `
  query GetPoint($id: ID!) {
    getPoint(id: $id) {
      id
      points
      currentPoints
      max
      min
      maxDate
      minDate
      currentDate
      dayCount
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      owner
    }
  }
`;
export const listPoints = /* GraphQL */ `
  query ListPoints(
    $filter: ModelPointFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listPoints(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        points
        currentPoints
        max
        min
        maxDate
        minDate
        currentDate
        dayCount
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const syncUserStats = /* GraphQL */ `
  query SyncUserStats(
    $filter: ModelUserStatFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncUserStats(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        primaryGoalType
        secondaryGoalType
        userId
        value
        currentValue
        max
        min
        maxDate
        minDate
        currentDate
        dayCount
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const getUserStat = /* GraphQL */ `
  query GetUserStat($id: ID!) {
    getUserStat(id: $id) {
      id
      primaryGoalType
      secondaryGoalType
      userId
      value
      currentValue
      max
      min
      maxDate
      minDate
      currentDate
      dayCount
      ttl
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      owner
    }
  }
`;
export const listUserStats = /* GraphQL */ `
  query ListUserStats(
    $filter: ModelUserStatFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listUserStats(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        primaryGoalType
        secondaryGoalType
        userId
        value
        currentValue
        max
        min
        maxDate
        minDate
        currentDate
        dayCount
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const syncChallengeSystems = /* GraphQL */ `
  query SyncChallengeSystems(
    $filter: ModelChallengeSystemFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncChallengeSystems(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        missedCount
        reward
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const getChallengeSystem = /* GraphQL */ `
  query GetChallengeSystem($id: ID!) {
    getChallengeSystem(id: $id) {
      id
      missedCount
      reward
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      owner
    }
  }
`;
export const listChallengeSystems = /* GraphQL */ `
  query ListChallengeSystems(
    $filter: ModelChallengeSystemFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listChallengeSystems(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        missedCount
        reward
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const syncUserActivateTypes = /* GraphQL */ `
  query SyncUserActivateTypes(
    $filter: ModelUserActivateTypeFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncUserActivateTypes(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        userId
        primaryGoalType
        secondaryGoalType
        activated
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const getUserActivateType = /* GraphQL */ `
  query GetUserActivateType($id: ID!) {
    getUserActivateType(id: $id) {
      id
      userId
      primaryGoalType
      secondaryGoalType
      activated
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      owner
    }
  }
`;
export const listUserActivateTypes = /* GraphQL */ `
  query ListUserActivateTypes(
    $filter: ModelUserActivateTypeFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listUserActivateTypes(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        userId
        primaryGoalType
        secondaryGoalType
        activated
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const syncDietData = /* GraphQL */ `
  query SyncDietData(
    $filter: ModelDietDataFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncDietData(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        userId
        date
        userIdType
        type
        totalCalories
        totalFat
        totalProtein
        totalCarbs
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const getDietData = /* GraphQL */ `
  query GetDietData($id: ID!) {
    getDietData(id: $id) {
      id
      userId
      date
      userIdType
      type
      totalCalories
      totalFat
      totalProtein
      totalCarbs
      ttl
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      owner
    }
  }
`;
export const listDietDatas = /* GraphQL */ `
  query ListDietDatas(
    $filter: ModelDietDataFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listDietDatas(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        userId
        date
        userIdType
        type
        totalCalories
        totalFat
        totalProtein
        totalCarbs
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const syncDietSettings = /* GraphQL */ `
  query SyncDietSettings(
    $filter: ModelDietSettingsFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncDietSettings(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        sub
        diet
        protein
        proteinUnit
        proteinModifier
        carbs
        carbsUnit
        carbsModifier
        fat
        fatUnit
        fatModifier
        netCarbs
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const getDietSettings = /* GraphQL */ `
  query GetDietSettings($id: ID!) {
    getDietSettings(id: $id) {
      id
      sub
      diet
      protein
      proteinUnit
      proteinModifier
      carbs
      carbsUnit
      carbsModifier
      fat
      fatUnit
      fatModifier
      netCarbs
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      owner
    }
  }
`;
export const listDietSettingss = /* GraphQL */ `
  query ListDietSettingss(
    $filter: ModelDietSettingsFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listDietSettingss(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        sub
        diet
        protein
        proteinUnit
        proteinModifier
        carbs
        carbsUnit
        carbsModifier
        fat
        fatUnit
        fatModifier
        netCarbs
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const syncExercises = /* GraphQL */ `
  query SyncExercises(
    $filter: ModelExerciseFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncExercises(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        name
        type
        description
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
      }
      nextToken
      startedAt
    }
  }
`;
export const getExercise = /* GraphQL */ `
  query GetExercise($id: ID!) {
    getExercise(id: $id) {
      id
      name
      type
      description
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
    }
  }
`;
export const listExercises = /* GraphQL */ `
  query ListExercises(
    $filter: ModelExerciseFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listExercises(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        name
        type
        description
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
      }
      nextToken
      startedAt
    }
  }
`;
export const syncRoutines = /* GraphQL */ `
  query SyncRoutines(
    $filter: ModelRoutineFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncRoutines(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        name
        description
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
      }
      nextToken
      startedAt
    }
  }
`;
export const getRoutine = /* GraphQL */ `
  query GetRoutine($id: ID!) {
    getRoutine(id: $id) {
      id
      name
      description
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
    }
  }
`;
export const listRoutines = /* GraphQL */ `
  query ListRoutines(
    $filter: ModelRoutineFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listRoutines(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        name
        description
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
      }
      nextToken
      startedAt
    }
  }
`;
export const syncExerciseRoutines = /* GraphQL */ `
  query SyncExerciseRoutines(
    $filter: ModelExerciseRoutineFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncExerciseRoutines(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        routineId
        exerciseId
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
      }
      nextToken
      startedAt
    }
  }
`;
export const syncRoutineData = /* GraphQL */ `
  query SyncRoutineData(
    $filter: ModelRoutineDataFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncRoutineData(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        userId
        date
        userIdType
        type
        rest
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const getRoutineData = /* GraphQL */ `
  query GetRoutineData($id: ID!) {
    getRoutineData(id: $id) {
      id
      userId
      date
      userIdType
      type
      rest
      ttl
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      owner
    }
  }
`;
export const listRoutineDatas = /* GraphQL */ `
  query ListRoutineDatas(
    $filter: ModelRoutineDataFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listRoutineDatas(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        userId
        date
        userIdType
        type
        rest
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const syncFavoriteRoutines = /* GraphQL */ `
  query SyncFavoriteRoutines(
    $filter: ModelFavoriteRoutineFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncFavoriteRoutines(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        userId
        routineId
        name
        description
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const getFavoriteRoutine = /* GraphQL */ `
  query GetFavoriteRoutine($id: ID!) {
    getFavoriteRoutine(id: $id) {
      id
      userId
      routineId
      name
      description
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      owner
    }
  }
`;
export const listFavoriteRoutines = /* GraphQL */ `
  query ListFavoriteRoutines(
    $filter: ModelFavoriteRoutineFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listFavoriteRoutines(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        userId
        routineId
        name
        description
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const syncUserExerciseStats = /* GraphQL */ `
  query SyncUserExerciseStats(
    $filter: ModelUserExerciseStatFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncUserExerciseStats(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        primaryGoalType
        secondaryGoalType
        userId
        repsValue
        minutesValue
        weightValue
        distanceValue
        currentRepsValue
        currentMinutesValue
        currentDistanceValue
        currentWeightValue
        maxReps
        minReps
        maxRepsDate
        minRepsDate
        maxMinutes
        minMinutes
        maxMinutesDate
        minMinutesDate
        maxWeight
        minWeight
        maxWeightDate
        minWeightDate
        maxDistance
        minDistance
        maxDistanceDate
        minDistanceDate
        currentDate
        dayCount
        unit
        statPreference
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const getUserExerciseStat = /* GraphQL */ `
  query GetUserExerciseStat($id: ID!) {
    getUserExerciseStat(id: $id) {
      id
      primaryGoalType
      secondaryGoalType
      userId
      repsValue
      minutesValue
      weightValue
      distanceValue
      currentRepsValue
      currentMinutesValue
      currentDistanceValue
      currentWeightValue
      maxReps
      minReps
      maxRepsDate
      minRepsDate
      maxMinutes
      minMinutes
      maxMinutesDate
      minMinutesDate
      maxWeight
      minWeight
      maxWeightDate
      minWeightDate
      maxDistance
      minDistance
      maxDistanceDate
      minDistanceDate
      currentDate
      dayCount
      unit
      statPreference
      ttl
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      owner
    }
  }
`;
export const listUserExerciseStats = /* GraphQL */ `
  query ListUserExerciseStats(
    $filter: ModelUserExerciseStatFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listUserExerciseStats(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        primaryGoalType
        secondaryGoalType
        userId
        repsValue
        minutesValue
        weightValue
        distanceValue
        currentRepsValue
        currentMinutesValue
        currentDistanceValue
        currentWeightValue
        maxReps
        minReps
        maxRepsDate
        minRepsDate
        maxMinutes
        minMinutes
        maxMinutesDate
        minMinutesDate
        maxWeight
        minWeight
        maxWeightDate
        minWeightDate
        maxDistance
        minDistance
        maxDistanceDate
        minDistanceDate
        currentDate
        dayCount
        unit
        statPreference
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const syncExertionData = /* GraphQL */ `
  query SyncExertionData(
    $filter: ModelExertionDataFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncExertionData(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        date
        userId
        RPE
        primaryGoalType
        userIdPrimarySecondaryGoalType
        secondaryGoalType
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const getExertionData = /* GraphQL */ `
  query GetExertionData($id: ID!) {
    getExertionData(id: $id) {
      id
      date
      userId
      RPE
      primaryGoalType
      userIdPrimarySecondaryGoalType
      secondaryGoalType
      ttl
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      owner
    }
  }
`;
export const listExertionDatas = /* GraphQL */ `
  query ListExertionDatas(
    $filter: ModelExertionDataFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listExertionDatas(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        date
        userId
        RPE
        primaryGoalType
        userIdPrimarySecondaryGoalType
        secondaryGoalType
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const syncDailyToDos = /* GraphQL */ `
  query SyncDailyToDos(
    $filter: ModelDailyToDoFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncDailyToDos(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        userId
        notes
        completed
        startDate
        endDate
        completedDate
        nextDay
        important
        date
        event
        scheduleId
        deadline
        recurring
        extractedDate
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const getDailyToDo = /* GraphQL */ `
  query GetDailyToDo($id: ID!) {
    getDailyToDo(id: $id) {
      id
      userId
      notes
      completed
      startDate
      endDate
      completedDate
      nextDay
      important
      date
      event
      scheduleId
      deadline
      recurring
      extractedDate
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      owner
    }
  }
`;
export const listDailyToDos = /* GraphQL */ `
  query ListDailyToDos(
    $filter: ModelDailyToDoFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listDailyToDos(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        userId
        notes
        completed
        startDate
        endDate
        completedDate
        nextDay
        important
        date
        event
        scheduleId
        deadline
        recurring
        extractedDate
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const syncScheduleToDos = /* GraphQL */ `
  query SyncScheduleToDos(
    $filter: ModelScheduleToDoFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncScheduleToDos(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        taskId
        status
        userId
        date
        dayFrequency
        frequency
        interval
        startDate
        endDate
        byWeekDay
        dayReminder
        dayReminderTimeRange
        dayReminderTimes
        deadlineAlarms
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const getScheduleToDo = /* GraphQL */ `
  query GetScheduleToDo($id: ID!) {
    getScheduleToDo(id: $id) {
      id
      taskId
      status
      userId
      date
      dayFrequency
      frequency
      interval
      startDate
      endDate
      byWeekDay
      dayReminder
      dayReminderTimeRange
      dayReminderTimes
      deadlineAlarms
      ttl
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      owner
    }
  }
`;
export const listScheduleToDos = /* GraphQL */ `
  query ListScheduleToDos(
    $filter: ModelScheduleToDoFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listScheduleToDos(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        taskId
        status
        userId
        date
        dayFrequency
        frequency
        interval
        startDate
        endDate
        byWeekDay
        dayReminder
        dayReminderTimeRange
        dayReminderTimes
        deadlineAlarms
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const syncMasterToDos = /* GraphQL */ `
  query SyncMasterToDos(
    $filter: ModelMasterToDoFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncMasterToDos(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        userId
        notes
        completed
        startDate
        endDate
        completedDate
        nextDay
        important
        date
        event
        scheduleId
        deadline
        recurring
        extractedDate
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const getMasterToDo = /* GraphQL */ `
  query GetMasterToDo($id: ID!) {
    getMasterToDo(id: $id) {
      id
      userId
      notes
      completed
      startDate
      endDate
      completedDate
      nextDay
      important
      date
      event
      scheduleId
      deadline
      recurring
      extractedDate
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      owner
    }
  }
`;
export const listMasterToDos = /* GraphQL */ `
  query ListMasterToDos(
    $filter: ModelMasterToDoFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listMasterToDos(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        userId
        notes
        completed
        startDate
        endDate
        completedDate
        nextDay
        important
        date
        event
        scheduleId
        deadline
        recurring
        extractedDate
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const syncWeeklyToDos = /* GraphQL */ `
  query SyncWeeklyToDos(
    $filter: ModelWeeklyToDoFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncWeeklyToDos(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        userId
        notes
        completed
        startDate
        endDate
        completedDate
        nextDay
        important
        date
        event
        scheduleId
        deadline
        recurring
        extractedDate
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const getWeeklyToDo = /* GraphQL */ `
  query GetWeeklyToDo($id: ID!) {
    getWeeklyToDo(id: $id) {
      id
      userId
      notes
      completed
      startDate
      endDate
      completedDate
      nextDay
      important
      date
      event
      scheduleId
      deadline
      recurring
      extractedDate
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      owner
    }
  }
`;
export const listWeeklyToDos = /* GraphQL */ `
  query ListWeeklyToDos(
    $filter: ModelWeeklyToDoFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listWeeklyToDos(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        userId
        notes
        completed
        startDate
        endDate
        completedDate
        nextDay
        important
        date
        event
        scheduleId
        deadline
        recurring
        extractedDate
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const syncGroceryToDos = /* GraphQL */ `
  query SyncGroceryToDos(
    $filter: ModelGroceryToDoFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncGroceryToDos(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        userId
        notes
        completed
        startDate
        endDate
        completedDate
        nextDay
        important
        date
        event
        scheduleId
        deadline
        recurring
        extractedDate
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const getGroceryToDo = /* GraphQL */ `
  query GetGroceryToDo($id: ID!) {
    getGroceryToDo(id: $id) {
      id
      userId
      notes
      completed
      startDate
      endDate
      completedDate
      nextDay
      important
      date
      event
      scheduleId
      deadline
      recurring
      extractedDate
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      owner
    }
  }
`;
export const listGroceryToDos = /* GraphQL */ `
  query ListGroceryToDos(
    $filter: ModelGroceryToDoFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listGroceryToDos(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        userId
        notes
        completed
        startDate
        endDate
        completedDate
        nextDay
        important
        date
        event
        scheduleId
        deadline
        recurring
        extractedDate
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const foodDataByUser = /* GraphQL */ `
  query FoodDataByUser(
    $userId: ID
    $date: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelUserMealLoggerFilterInput
    $limit: Int
    $nextToken: String
  ) {
    foodDataByUser(
      userId: $userId
      date: $date
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        date
        userId
        image
        type
        carbs
        carbsInGrams
        fat
        fatInGrams
        protein
        proteinInGrams
        calories
        sodium
        glycemicIndex
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const membershipsByUser = /* GraphQL */ `
  query MembershipsByUser(
    $userId: ID
    $startDate: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelMembershipFilterInput
    $limit: Int
    $nextToken: String
  ) {
    membershipsByUser(
      userId: $userId
      startDate: $startDate
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        startDate
        customerId
        userId
        amount
        currentPeriodEnd
        actualEndDate
        refundAmount
        autoRenew
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
      }
      nextToken
      startedAt
    }
  }
`;
export const subscriptionsByUser = /* GraphQL */ `
  query SubscriptionsByUser(
    $userId: ID
    $startDate: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: Modelactive_subscriptionFilterInput
    $limit: Int
    $nextToken: String
  ) {
    subscriptionsByUser(
      userId: $userId
      startDate: $startDate
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        startDate
        customerId
        userId
        amount
        currentPeriodEnd
        autoRenew
        refunded
        isReviewed
        timezone
        planId
        description
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
      }
      nextToken
      startedAt
    }
  }
`;
export const paidSubscriptionsByUser = /* GraphQL */ `
  query PaidSubscriptionsByUser(
    $userId: ID
    $startDate: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelPaidSubscriptionFilterInput
    $limit: Int
    $nextToken: String
  ) {
    PaidSubscriptionsByUser(
      userId: $userId
      startDate: $startDate
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        startDate
        customerId
        userId
        amount
        currentPeriodEnd
        actualEndDate
        refundAmount
        autoRenew
        timezone
        planId
        description
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
      }
      nextToken
      startedAt
    }
  }
`;
export const userTransactionByTrainerByDate = /* GraphQL */ `
  query UserTransactionByTrainerByDate(
    $userId: ID
    $date: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelUserTransactionFilterInput
    $limit: Int
    $nextToken: String
  ) {
    userTransactionByTrainerByDate(
      userId: $userId
      date: $date
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        date
        userId
        ttl
        amount
        refundAmount
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
      }
      nextToken
      startedAt
    }
  }
`;
export const listActiveSchedulesByDate = /* GraphQL */ `
  query ListActiveSchedulesByDate(
    $userId: ID
    $dateStatus: ModelScheduleByUserByDateCompositeKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelScheduleFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listActiveSchedulesByDate(
      userId: $userId
      dateStatus: $dateStatus
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        primaryGoalType
        secondaryGoalType
        status
        userId
        date
        unit
        rate
        frequency
        startDate
        endDate
        byWeekDay
        reminder
        reminderTimeRange
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const listStreaksByGoal = /* GraphQL */ `
  query ListStreaksByGoal(
    $goalId: ID
    $id: ModelIDKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelStreakFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listStreaksByGoal(
      goalId: $goalId
      id: $id
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        dataType
        goalId
        streak
        startDate
        endDate
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        trainerId
      }
      nextToken
      startedAt
    }
  }
`;
export const listUserGoalsByDate = /* GraphQL */ `
  query ListUserGoalsByDate(
    $userId: ID
    $dateStatusPrimaryGoalType: ModelGoalByUserByDateCompositeKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelGoalFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listUserGoalsByDate(
      userId: $userId
      dateStatusPrimaryGoalType: $dateStatusPrimaryGoalType
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        userId
        date
        status
        endDate
        primaryGoalType
        secondaryGoalType
        scheduleId
        goal
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const listUserGoalExercisesByDate = /* GraphQL */ `
  query ListUserGoalExercisesByDate(
    $userId: ID
    $dateStatusPrimaryGoalTypeSecondaryGoalType: ModelGoalExerciseByUserByDateCompositeKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelGoalExerciseFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listUserGoalExercisesByDate(
      userId: $userId
      dateStatusPrimaryGoalTypeSecondaryGoalType: $dateStatusPrimaryGoalTypeSecondaryGoalType
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        userId
        date
        status
        endDate
        primaryGoalType
        secondaryGoalType
        scheduleId
        goal
        goalUnit
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const listUserBackgroundTaskByDate = /* GraphQL */ `
  query ListUserBackgroundTaskByDate(
    $userId: ID
    $lastSync: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelBackgroundTaskFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listUserBackgroundTaskByDate(
      userId: $userId
      lastSync: $lastSync
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        userId
        lastSync
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const listUserBackgroundTimerByGoal = /* GraphQL */ `
  query ListUserBackgroundTimerByGoal(
    $userId: ID
    $primaryGoalTypeSecondaryGoalTypeStartTime: ModelBackgroundTimerByUserByGoalCompositeKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelBackgroundTimerFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listUserBackgroundTimerByGoal(
      userId: $userId
      primaryGoalTypeSecondaryGoalTypeStartTime: $primaryGoalTypeSecondaryGoalTypeStartTime
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        userId
        primaryGoalType
        secondaryGoalType
        startTime
        endTime
        breakEpisode
        breakStartTime
        breakTimeDuration
        numberOfBreakEpisodes
        isBreak
        workEpisode
        workStartTime
        workTimeDuration
        numberOfWorkEpisodes
        totalActiveTime
        accumulatedDuration
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const fruitDataByUserByDate = /* GraphQL */ `
  query FruitDataByUserByDate(
    $userId: ID
    $date: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelFruitDataFilterInput
    $limit: Int
    $nextToken: String
  ) {
    fruitDataByUserByDate(
      userId: $userId
      date: $date
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        date
        userId
        servings
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const vegetableDataByUserByDate = /* GraphQL */ `
  query VegetableDataByUserByDate(
    $userId: ID
    $date: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelVegetableDataFilterInput
    $limit: Int
    $nextToken: String
  ) {
    vegetableDataByUserByDate(
      userId: $userId
      date: $date
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        date
        userId
        servings
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const stepsDataByUserByDate = /* GraphQL */ `
  query StepsDataByUserByDate(
    $userId: ID
    $date: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelStepDataFilterInput
    $limit: Int
    $nextToken: String
  ) {
    stepsDataByUserByDate(
      userId: $userId
      date: $date
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        date
        userId
        steps
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const strengthDataByUserByTypeAndDate = /* GraphQL */ `
  query StrengthDataByUserByTypeAndDate(
    $userIdType: String
    $date: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelStrengthDataFilterInput
    $limit: Int
    $nextToken: String
  ) {
    strengthDataByUserByTypeAndDate(
      userIdType: $userIdType
      date: $date
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        userId
        type
        userIdType
        date
        weight
        reps
        scheduleId
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const exerciseDataByUserByTypeAndDate = /* GraphQL */ `
  query ExerciseDataByUserByTypeAndDate(
    $userIdType: String
    $date: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelEnduranceDataFilterInput
    $limit: Int
    $nextToken: String
  ) {
    exerciseDataByUserByTypeAndDate(
      userIdType: $userIdType
      date: $date
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        date
        userId
        minutes
        reps
        type
        distance
        userIdType
        scheduleId
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const exerciseDataByUserByDate = /* GraphQL */ `
  query ExerciseDataByUserByDate(
    $userId: ID
    $date: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelGenericExerciseDataFilterInput
    $limit: Int
    $nextToken: String
  ) {
    exerciseDataByUserByDate(
      userId: $userId
      date: $date
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        date
        userId
        minutes
        scheduleId
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const waterDataByUserByDate = /* GraphQL */ `
  query WaterDataByUserByDate(
    $userId: ID
    $date: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelWaterDataFilterInput
    $limit: Int
    $nextToken: String
  ) {
    waterDataByUserByDate(
      userId: $userId
      date: $date
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        date
        userId
        water
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const weightDataByUserByDate = /* GraphQL */ `
  query WeightDataByUserByDate(
    $userId: ID
    $date: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelWeightDataFilterInput
    $limit: Int
    $nextToken: String
  ) {
    weightDataByUserByDate(
      userId: $userId
      date: $date
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        date
        userId
        weight
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const newSkillDataByUserByTypeAndDate = /* GraphQL */ `
  query NewSkillDataByUserByTypeAndDate(
    $userIdType: String
    $date: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelNewSkillTypeDataFilterInput
    $limit: Int
    $nextToken: String
  ) {
    newSkillDataByUserByTypeAndDate(
      userIdType: $userIdType
      date: $date
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        date
        userId
        minutes
        type
        userIdType
        scheduleId
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const habitDataByUserByTypeAndDate = /* GraphQL */ `
  query HabitDataByUserByTypeAndDate(
    $userIdType: String
    $date: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelHabitTypeDataFilterInput
    $limit: Int
    $nextToken: String
  ) {
    habitDataByUserByTypeAndDate(
      userIdType: $userIdType
      date: $date
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        date
        userId
        minutes
        type
        userIdType
        scheduleId
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const sleepDataByUserByDate = /* GraphQL */ `
  query SleepDataByUserByDate(
    $userId: ID
    $date: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelSleepDataFilterInput
    $limit: Int
    $nextToken: String
  ) {
    sleepDataByUserByDate(
      userId: $userId
      date: $date
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        date
        userId
        hours
        scheduleId
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const meditationDataByUserByDate = /* GraphQL */ `
  query MeditationDataByUserByDate(
    $userId: ID
    $date: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelMeditationDataFilterInput
    $limit: Int
    $nextToken: String
  ) {
    meditationDataByUserByDate(
      userId: $userId
      date: $date
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        date
        userId
        minutes
        scheduleId
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const waistDataByUserByDate = /* GraphQL */ `
  query WaistDataByUserByDate(
    $userId: ID
    $date: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelWaistDataFilterInput
    $limit: Int
    $nextToken: String
  ) {
    waistDataByUserByDate(
      userId: $userId
      date: $date
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        date
        userId
        inches
        scheduleId
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const listFoodsByMeal = /* GraphQL */ `
  query ListFoodsByMeal(
    $mealId: ID
    $foodId: ModelIDKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelUserFoodLoggerFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listFoodsByMeal(
      mealId: $mealId
      foodId: $foodId
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        userId
        date
        foodId
        mealId
        image
        name
        sodium
        glycemicIndex
        protein
        proteinInGrams
        carbsInGrams
        carbs
        fat
        fatInGrams
        calories
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const listFoodsByUserByDate = /* GraphQL */ `
  query ListFoodsByUserByDate(
    $userId: ID
    $date: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelUserFoodLoggerFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listFoodsByUserByDate(
      userId: $userId
      date: $date
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        userId
        date
        foodId
        mealId
        image
        name
        sodium
        glycemicIndex
        protein
        proteinInGrams
        carbsInGrams
        carbs
        fat
        fatInGrams
        calories
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const listGoalTypesByUser = /* GraphQL */ `
  query ListGoalTypesByUser(
    $userId: ID
    $primaryGoalTypeSecondaryGoalTypeDate: ModelLevelByUserByGoalTypeCompositeKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelLevelFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listGoalTypesByUser(
      userId: $userId
      primaryGoalTypeSecondaryGoalTypeDate: $primaryGoalTypeSecondaryGoalTypeDate
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        userId
        level
        attempts
        primaryGoalType
        secondaryGoalType
        date
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const listStatsByUser = /* GraphQL */ `
  query ListStatsByUser(
    $userId: ID
    $primaryGoalType: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelUserStatFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listStatsByUser(
      userId: $userId
      primaryGoalType: $primaryGoalType
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        primaryGoalType
        secondaryGoalType
        userId
        value
        currentValue
        max
        min
        maxDate
        minDate
        currentDate
        dayCount
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const listActivateTypesByUser = /* GraphQL */ `
  query ListActivateTypesByUser(
    $userId: ID
    $primaryGoalTypeSecondaryGoalType: ModelUserActivateTypeByUserByGoalTypeCompositeKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelUserActivateTypeFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listActivateTypesByUser(
      userId: $userId
      primaryGoalTypeSecondaryGoalType: $primaryGoalTypeSecondaryGoalType
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        userId
        primaryGoalType
        secondaryGoalType
        activated
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const dietDataByUserByTypeAndDate = /* GraphQL */ `
  query DietDataByUserByTypeAndDate(
    $userIdType: String
    $date: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelDietDataFilterInput
    $limit: Int
    $nextToken: String
  ) {
    dietDataByUserByTypeAndDate(
      userIdType: $userIdType
      date: $date
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        userId
        date
        userIdType
        type
        totalCalories
        totalFat
        totalProtein
        totalCarbs
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const listByName = /* GraphQL */ `
  query ListByName(
    $name: ID
    $sortDirection: ModelSortDirection
    $filter: ModelExerciseFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listByName(
      name: $name
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        name
        type
        description
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
      }
      nextToken
      startedAt
    }
  }
`;
export const byName = /* GraphQL */ `
  query ByName(
    $name: ID
    $sortDirection: ModelSortDirection
    $filter: ModelRoutineFilterInput
    $limit: Int
    $nextToken: String
  ) {
    byName(
      name: $name
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        name
        description
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
      }
      nextToken
      startedAt
    }
  }
`;
export const routineDataByUserByTypeAndDate = /* GraphQL */ `
  query RoutineDataByUserByTypeAndDate(
    $userIdType: String
    $date: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelRoutineDataFilterInput
    $limit: Int
    $nextToken: String
  ) {
    routineDataByUserByTypeAndDate(
      userIdType: $userIdType
      date: $date
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        userId
        date
        userIdType
        type
        rest
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const listExerciseStatsByUser = /* GraphQL */ `
  query ListExerciseStatsByUser(
    $userId: ID
    $primaryGoalTypeSecondaryGoalType: ModelUserExerciseStatByUserByPrimaryGoalTypeCompositeKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelUserExerciseStatFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listExerciseStatsByUser(
      userId: $userId
      primaryGoalTypeSecondaryGoalType: $primaryGoalTypeSecondaryGoalType
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        primaryGoalType
        secondaryGoalType
        userId
        repsValue
        minutesValue
        weightValue
        distanceValue
        currentRepsValue
        currentMinutesValue
        currentDistanceValue
        currentWeightValue
        maxReps
        minReps
        maxRepsDate
        minRepsDate
        maxMinutes
        minMinutes
        maxMinutesDate
        minMinutesDate
        maxWeight
        minWeight
        maxWeightDate
        minWeightDate
        maxDistance
        minDistance
        maxDistanceDate
        minDistanceDate
        currentDate
        dayCount
        unit
        statPreference
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const listExertionDataByGoalAndDate = /* GraphQL */ `
  query ListExertionDataByGoalAndDate(
    $userIdPrimarySecondaryGoalType: ID
    $date: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelExertionDataFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listExertionDataByGoalAndDate(
      userIdPrimarySecondaryGoalType: $userIdPrimarySecondaryGoalType
      date: $date
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        date
        userId
        RPE
        primaryGoalType
        userIdPrimarySecondaryGoalType
        secondaryGoalType
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const listDailyTodosByUser = /* GraphQL */ `
  query ListDailyTodosByUser(
    $userId: ID
    $id: ModelIDKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelDailyToDoFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listDailyTodosByUser(
      userId: $userId
      id: $id
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        userId
        notes
        completed
        startDate
        endDate
        completedDate
        nextDay
        important
        date
        event
        scheduleId
        deadline
        recurring
        extractedDate
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const listActiveToDoSchedulesByDate = /* GraphQL */ `
  query ListActiveToDoSchedulesByDate(
    $userId: ID
    $dateStatus: ModelScheduleToDoByUserByDateCompositeKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelScheduleToDoFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listActiveToDoSchedulesByDate(
      userId: $userId
      dateStatus: $dateStatus
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        taskId
        status
        userId
        date
        dayFrequency
        frequency
        interval
        startDate
        endDate
        byWeekDay
        dayReminder
        dayReminderTimeRange
        dayReminderTimes
        deadlineAlarms
        ttl
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const listMasterTodosByUser = /* GraphQL */ `
  query ListMasterTodosByUser(
    $userId: ID
    $id: ModelIDKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelMasterToDoFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listMasterTodosByUser(
      userId: $userId
      id: $id
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        userId
        notes
        completed
        startDate
        endDate
        completedDate
        nextDay
        important
        date
        event
        scheduleId
        deadline
        recurring
        extractedDate
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const listWeeklyTodosByUser = /* GraphQL */ `
  query ListWeeklyTodosByUser(
    $userId: ID
    $id: ModelIDKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelWeeklyToDoFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listWeeklyTodosByUser(
      userId: $userId
      id: $id
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        userId
        notes
        completed
        startDate
        endDate
        completedDate
        nextDay
        important
        date
        event
        scheduleId
        deadline
        recurring
        extractedDate
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
export const listGroceryTodosByUser = /* GraphQL */ `
  query ListGroceryTodosByUser(
    $userId: ID
    $id: ModelIDKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelGroceryToDoFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listGroceryTodosByUser(
      userId: $userId
      id: $id
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        userId
        notes
        completed
        startDate
        endDate
        completedDate
        nextDay
        important
        date
        event
        scheduleId
        deadline
        recurring
        extractedDate
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`;
