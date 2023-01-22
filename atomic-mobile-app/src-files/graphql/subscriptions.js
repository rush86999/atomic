/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCreateUserProfile = /* GraphQL */ `
  subscription OnCreateUserProfile($owner: String) {
    onCreateUserProfile(owner: $owner) {
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
export const onUpdateUserProfile = /* GraphQL */ `
  subscription OnUpdateUserProfile($owner: String) {
    onUpdateUserProfile(owner: $owner) {
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
export const onDeleteUserProfile = /* GraphQL */ `
  subscription OnDeleteUserProfile($owner: String) {
    onDeleteUserProfile(owner: $owner) {
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
export const onCreateFollower = /* GraphQL */ `
  subscription OnCreateFollower($owner: String) {
    onCreateFollower(owner: $owner) {
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
export const onUpdateFollower = /* GraphQL */ `
  subscription OnUpdateFollower($owner: String) {
    onUpdateFollower(owner: $owner) {
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
export const onDeleteFollower = /* GraphQL */ `
  subscription OnDeleteFollower($owner: String) {
    onDeleteFollower(owner: $owner) {
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
export const onCreateFollowing = /* GraphQL */ `
  subscription OnCreateFollowing($owner: String) {
    onCreateFollowing(owner: $owner) {
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
export const onUpdateFollowing = /* GraphQL */ `
  subscription OnUpdateFollowing($owner: String) {
    onUpdateFollowing(owner: $owner) {
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
export const onDeleteFollowing = /* GraphQL */ `
  subscription OnDeleteFollowing($owner: String) {
    onDeleteFollowing(owner: $owner) {
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
export const onCreateArticle = /* GraphQL */ `
  subscription OnCreateArticle {
    onCreateArticle {
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
export const onUpdateArticle = /* GraphQL */ `
  subscription OnUpdateArticle {
    onUpdateArticle {
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
export const onDeleteArticle = /* GraphQL */ `
  subscription OnDeleteArticle {
    onDeleteArticle {
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
export const onCreatePost = /* GraphQL */ `
  subscription OnCreatePost($owner: String) {
    onCreatePost(owner: $owner) {
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
export const onUpdatePost = /* GraphQL */ `
  subscription OnUpdatePost($owner: String) {
    onUpdatePost(owner: $owner) {
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
export const onDeletePost = /* GraphQL */ `
  subscription OnDeletePost($owner: String) {
    onDeletePost(owner: $owner) {
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
export const onCreateTag = /* GraphQL */ `
  subscription OnCreateTag {
    onCreateTag {
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
export const onUpdateTag = /* GraphQL */ `
  subscription OnUpdateTag {
    onUpdateTag {
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
export const onDeleteTag = /* GraphQL */ `
  subscription OnDeleteTag {
    onDeleteTag {
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
export const onCreateComment = /* GraphQL */ `
  subscription OnCreateComment($owner: String) {
    onCreateComment(owner: $owner) {
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
export const onUpdateComment = /* GraphQL */ `
  subscription OnUpdateComment($owner: String) {
    onUpdateComment(owner: $owner) {
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
export const onDeleteComment = /* GraphQL */ `
  subscription OnDeleteComment($owner: String) {
    onDeleteComment(owner: $owner) {
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
export const onCreatePostLike = /* GraphQL */ `
  subscription OnCreatePostLike($owner: String) {
    onCreatePostLike(owner: $owner) {
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
export const onUpdatePostLike = /* GraphQL */ `
  subscription OnUpdatePostLike($owner: String) {
    onUpdatePostLike(owner: $owner) {
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
export const onDeletePostLike = /* GraphQL */ `
  subscription OnDeletePostLike($owner: String) {
    onDeletePostLike(owner: $owner) {
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
export const onCreatePointSystem = /* GraphQL */ `
  subscription OnCreatePointSystem($owner: String) {
    onCreatePointSystem(owner: $owner) {
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
export const onUpdatePointSystem = /* GraphQL */ `
  subscription OnUpdatePointSystem($owner: String) {
    onUpdatePointSystem(owner: $owner) {
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
export const onDeletePointSystem = /* GraphQL */ `
  subscription OnDeletePointSystem($owner: String) {
    onDeletePointSystem(owner: $owner) {
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
export const onCreateUser = /* GraphQL */ `
  subscription OnCreateUser($owner: String) {
    onCreateUser(owner: $owner) {
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
export const onUpdateUser = /* GraphQL */ `
  subscription OnUpdateUser($owner: String) {
    onUpdateUser(owner: $owner) {
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
export const onDeleteUser = /* GraphQL */ `
  subscription OnDeleteUser($owner: String) {
    onDeleteUser(owner: $owner) {
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
export const onCreateSettings = /* GraphQL */ `
  subscription OnCreateSettings($owner: String) {
    onCreateSettings(owner: $owner) {
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
export const onUpdateSettings = /* GraphQL */ `
  subscription OnUpdateSettings($owner: String) {
    onUpdateSettings(owner: $owner) {
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
export const onDeleteSettings = /* GraphQL */ `
  subscription OnDeleteSettings($owner: String) {
    onDeleteSettings(owner: $owner) {
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
export const onCreateMealPreferences = /* GraphQL */ `
  subscription OnCreateMealPreferences($owner: String) {
    onCreateMealPreferences(owner: $owner) {
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
export const onUpdateMealPreferences = /* GraphQL */ `
  subscription OnUpdateMealPreferences($owner: String) {
    onUpdateMealPreferences(owner: $owner) {
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
export const onDeleteMealPreferences = /* GraphQL */ `
  subscription OnDeleteMealPreferences($owner: String) {
    onDeleteMealPreferences(owner: $owner) {
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
export const onCreateNotifications = /* GraphQL */ `
  subscription OnCreateNotifications {
    onCreateNotifications {
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
export const onUpdateNotifications = /* GraphQL */ `
  subscription OnUpdateNotifications {
    onUpdateNotifications {
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
export const onDeleteNotifications = /* GraphQL */ `
  subscription OnDeleteNotifications {
    onDeleteNotifications {
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
export const onCreatePlan = /* GraphQL */ `
  subscription OnCreatePlan($owner: String) {
    onCreatePlan(owner: $owner) {
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
export const onUpdatePlan = /* GraphQL */ `
  subscription OnUpdatePlan($owner: String) {
    onUpdatePlan(owner: $owner) {
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
export const onDeletePlan = /* GraphQL */ `
  subscription OnDeletePlan($owner: String) {
    onDeletePlan(owner: $owner) {
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
export const onCreateRecipeFavorite = /* GraphQL */ `
  subscription OnCreateRecipeFavorite($owner: String) {
    onCreateRecipeFavorite(owner: $owner) {
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
export const onUpdateRecipeFavorite = /* GraphQL */ `
  subscription OnUpdateRecipeFavorite($owner: String) {
    onUpdateRecipeFavorite(owner: $owner) {
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
export const onDeleteRecipeFavorite = /* GraphQL */ `
  subscription OnDeleteRecipeFavorite($owner: String) {
    onDeleteRecipeFavorite(owner: $owner) {
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
export const onCreateFavoriteMeal = /* GraphQL */ `
  subscription OnCreateFavoriteMeal($owner: String) {
    onCreateFavoriteMeal(owner: $owner) {
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
export const onUpdateFavoriteMeal = /* GraphQL */ `
  subscription OnUpdateFavoriteMeal($owner: String) {
    onUpdateFavoriteMeal(owner: $owner) {
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
export const onDeleteFavoriteMeal = /* GraphQL */ `
  subscription OnDeleteFavoriteMeal($owner: String) {
    onDeleteFavoriteMeal(owner: $owner) {
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
export const onCreateUserMealLogger = /* GraphQL */ `
  subscription OnCreateUserMealLogger($owner: String) {
    onCreateUserMealLogger(owner: $owner) {
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
export const onUpdateUserMealLogger = /* GraphQL */ `
  subscription OnUpdateUserMealLogger($owner: String) {
    onUpdateUserMealLogger(owner: $owner) {
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
export const onDeleteUserMealLogger = /* GraphQL */ `
  subscription OnDeleteUserMealLogger($owner: String) {
    onDeleteUserMealLogger(owner: $owner) {
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
export const onCreateMembership = /* GraphQL */ `
  subscription OnCreateMembership($userId: String) {
    onCreateMembership(userId: $userId) {
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
export const onUpdateMembership = /* GraphQL */ `
  subscription OnUpdateMembership($userId: String) {
    onUpdateMembership(userId: $userId) {
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
export const onDeleteMembership = /* GraphQL */ `
  subscription OnDeleteMembership($userId: String) {
    onDeleteMembership(userId: $userId) {
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
export const onCreateactive_subscription = /* GraphQL */ `
  subscription OnCreateactive_subscription($userId: String) {
    onCreateactive_subscription(userId: $userId) {
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
export const onUpdateactive_subscription = /* GraphQL */ `
  subscription OnUpdateactive_subscription($userId: String) {
    onUpdateactive_subscription(userId: $userId) {
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
export const onDeleteactive_subscription = /* GraphQL */ `
  subscription OnDeleteactive_subscription($userId: String) {
    onDeleteactive_subscription(userId: $userId) {
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
export const onCreatePaidSubscription = /* GraphQL */ `
  subscription OnCreatePaidSubscription($userId: String) {
    onCreatePaidSubscription(userId: $userId) {
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
export const onUpdatePaidSubscription = /* GraphQL */ `
  subscription OnUpdatePaidSubscription($userId: String) {
    onUpdatePaidSubscription(userId: $userId) {
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
export const onDeletePaidSubscription = /* GraphQL */ `
  subscription OnDeletePaidSubscription($userId: String) {
    onDeletePaidSubscription(userId: $userId) {
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
export const onCreateUserTransaction = /* GraphQL */ `
  subscription OnCreateUserTransaction($userId: String) {
    onCreateUserTransaction(userId: $userId) {
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
export const onUpdateUserTransaction = /* GraphQL */ `
  subscription OnUpdateUserTransaction($userId: String) {
    onUpdateUserTransaction(userId: $userId) {
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
export const onDeleteUserTransaction = /* GraphQL */ `
  subscription OnDeleteUserTransaction($userId: String) {
    onDeleteUserTransaction(userId: $userId) {
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
export const onCreateSavedRecipeSearch = /* GraphQL */ `
  subscription OnCreateSavedRecipeSearch($owner: String) {
    onCreateSavedRecipeSearch(owner: $owner) {
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
export const onUpdateSavedRecipeSearch = /* GraphQL */ `
  subscription OnUpdateSavedRecipeSearch($owner: String) {
    onUpdateSavedRecipeSearch(owner: $owner) {
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
export const onDeleteSavedRecipeSearch = /* GraphQL */ `
  subscription OnDeleteSavedRecipeSearch($owner: String) {
    onDeleteSavedRecipeSearch(owner: $owner) {
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
export const onCreateShoppingList = /* GraphQL */ `
  subscription OnCreateShoppingList($owner: String) {
    onCreateShoppingList(owner: $owner) {
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
export const onUpdateShoppingList = /* GraphQL */ `
  subscription OnUpdateShoppingList($owner: String) {
    onUpdateShoppingList(owner: $owner) {
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
export const onDeleteShoppingList = /* GraphQL */ `
  subscription OnDeleteShoppingList($owner: String) {
    onDeleteShoppingList(owner: $owner) {
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
export const onCreateRecipe = /* GraphQL */ `
  subscription OnCreateRecipe($owner: String) {
    onCreateRecipe(owner: $owner) {
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
export const onUpdateRecipe = /* GraphQL */ `
  subscription OnUpdateRecipe($owner: String) {
    onUpdateRecipe(owner: $owner) {
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
export const onDeleteRecipe = /* GraphQL */ `
  subscription OnDeleteRecipe($owner: String) {
    onDeleteRecipe(owner: $owner) {
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
export const onCreateSchedule = /* GraphQL */ `
  subscription OnCreateSchedule($owner: String) {
    onCreateSchedule(owner: $owner) {
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
export const onUpdateSchedule = /* GraphQL */ `
  subscription OnUpdateSchedule($owner: String) {
    onUpdateSchedule(owner: $owner) {
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
export const onDeleteSchedule = /* GraphQL */ `
  subscription OnDeleteSchedule($owner: String) {
    onDeleteSchedule(owner: $owner) {
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
export const onCreateStreak = /* GraphQL */ `
  subscription OnCreateStreak($trainerId: String) {
    onCreateStreak(trainerId: $trainerId) {
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
export const onUpdateStreak = /* GraphQL */ `
  subscription OnUpdateStreak($trainerId: String) {
    onUpdateStreak(trainerId: $trainerId) {
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
export const onDeleteStreak = /* GraphQL */ `
  subscription OnDeleteStreak($trainerId: String) {
    onDeleteStreak(trainerId: $trainerId) {
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
export const onCreateRecipeDatabase = /* GraphQL */ `
  subscription OnCreateRecipeDatabase($owner: String) {
    onCreateRecipeDatabase(owner: $owner) {
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
export const onUpdateRecipeDatabase = /* GraphQL */ `
  subscription OnUpdateRecipeDatabase($owner: String) {
    onUpdateRecipeDatabase(owner: $owner) {
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
export const onDeleteRecipeDatabase = /* GraphQL */ `
  subscription OnDeleteRecipeDatabase($owner: String) {
    onDeleteRecipeDatabase(owner: $owner) {
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
export const onCreateMealPlan = /* GraphQL */ `
  subscription OnCreateMealPlan {
    onCreateMealPlan {
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
export const onUpdateMealPlan = /* GraphQL */ `
  subscription OnUpdateMealPlan {
    onUpdateMealPlan {
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
export const onDeleteMealPlan = /* GraphQL */ `
  subscription OnDeleteMealPlan {
    onDeleteMealPlan {
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
export const onCreateGoal = /* GraphQL */ `
  subscription OnCreateGoal($owner: String) {
    onCreateGoal(owner: $owner) {
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
export const onUpdateGoal = /* GraphQL */ `
  subscription OnUpdateGoal($owner: String) {
    onUpdateGoal(owner: $owner) {
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
export const onDeleteGoal = /* GraphQL */ `
  subscription OnDeleteGoal($owner: String) {
    onDeleteGoal(owner: $owner) {
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
export const onCreateGoalExercise = /* GraphQL */ `
  subscription OnCreateGoalExercise($owner: String) {
    onCreateGoalExercise(owner: $owner) {
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
export const onUpdateGoalExercise = /* GraphQL */ `
  subscription OnUpdateGoalExercise($owner: String) {
    onUpdateGoalExercise(owner: $owner) {
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
export const onDeleteGoalExercise = /* GraphQL */ `
  subscription OnDeleteGoalExercise($owner: String) {
    onDeleteGoalExercise(owner: $owner) {
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
export const onCreateBackgroundTask = /* GraphQL */ `
  subscription OnCreateBackgroundTask($owner: String) {
    onCreateBackgroundTask(owner: $owner) {
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
export const onUpdateBackgroundTask = /* GraphQL */ `
  subscription OnUpdateBackgroundTask($owner: String) {
    onUpdateBackgroundTask(owner: $owner) {
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
export const onDeleteBackgroundTask = /* GraphQL */ `
  subscription OnDeleteBackgroundTask($owner: String) {
    onDeleteBackgroundTask(owner: $owner) {
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
export const onCreateBackgroundTimer = /* GraphQL */ `
  subscription OnCreateBackgroundTimer($owner: String) {
    onCreateBackgroundTimer(owner: $owner) {
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
export const onUpdateBackgroundTimer = /* GraphQL */ `
  subscription OnUpdateBackgroundTimer($owner: String) {
    onUpdateBackgroundTimer(owner: $owner) {
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
export const onDeleteBackgroundTimer = /* GraphQL */ `
  subscription OnDeleteBackgroundTimer($owner: String) {
    onDeleteBackgroundTimer(owner: $owner) {
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
export const onCreateFruitData = /* GraphQL */ `
  subscription OnCreateFruitData($owner: String) {
    onCreateFruitData(owner: $owner) {
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
export const onUpdateFruitData = /* GraphQL */ `
  subscription OnUpdateFruitData($owner: String) {
    onUpdateFruitData(owner: $owner) {
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
export const onDeleteFruitData = /* GraphQL */ `
  subscription OnDeleteFruitData($owner: String) {
    onDeleteFruitData(owner: $owner) {
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
export const onCreateVegetableData = /* GraphQL */ `
  subscription OnCreateVegetableData($owner: String) {
    onCreateVegetableData(owner: $owner) {
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
export const onUpdateVegetableData = /* GraphQL */ `
  subscription OnUpdateVegetableData($owner: String) {
    onUpdateVegetableData(owner: $owner) {
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
export const onDeleteVegetableData = /* GraphQL */ `
  subscription OnDeleteVegetableData($owner: String) {
    onDeleteVegetableData(owner: $owner) {
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
export const onCreateStepData = /* GraphQL */ `
  subscription OnCreateStepData($owner: String) {
    onCreateStepData(owner: $owner) {
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
export const onUpdateStepData = /* GraphQL */ `
  subscription OnUpdateStepData($owner: String) {
    onUpdateStepData(owner: $owner) {
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
export const onDeleteStepData = /* GraphQL */ `
  subscription OnDeleteStepData($owner: String) {
    onDeleteStepData(owner: $owner) {
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
export const onCreateStrengthData = /* GraphQL */ `
  subscription OnCreateStrengthData($owner: String) {
    onCreateStrengthData(owner: $owner) {
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
export const onUpdateStrengthData = /* GraphQL */ `
  subscription OnUpdateStrengthData($owner: String) {
    onUpdateStrengthData(owner: $owner) {
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
export const onDeleteStrengthData = /* GraphQL */ `
  subscription OnDeleteStrengthData($owner: String) {
    onDeleteStrengthData(owner: $owner) {
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
export const onCreateEnduranceData = /* GraphQL */ `
  subscription OnCreateEnduranceData($owner: String) {
    onCreateEnduranceData(owner: $owner) {
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
export const onUpdateEnduranceData = /* GraphQL */ `
  subscription OnUpdateEnduranceData($owner: String) {
    onUpdateEnduranceData(owner: $owner) {
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
export const onDeleteEnduranceData = /* GraphQL */ `
  subscription OnDeleteEnduranceData($owner: String) {
    onDeleteEnduranceData(owner: $owner) {
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
export const onCreateGenericExerciseData = /* GraphQL */ `
  subscription OnCreateGenericExerciseData($owner: String) {
    onCreateGenericExerciseData(owner: $owner) {
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
export const onUpdateGenericExerciseData = /* GraphQL */ `
  subscription OnUpdateGenericExerciseData($owner: String) {
    onUpdateGenericExerciseData(owner: $owner) {
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
export const onDeleteGenericExerciseData = /* GraphQL */ `
  subscription OnDeleteGenericExerciseData($owner: String) {
    onDeleteGenericExerciseData(owner: $owner) {
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
export const onCreateWaterData = /* GraphQL */ `
  subscription OnCreateWaterData($owner: String) {
    onCreateWaterData(owner: $owner) {
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
export const onUpdateWaterData = /* GraphQL */ `
  subscription OnUpdateWaterData($owner: String) {
    onUpdateWaterData(owner: $owner) {
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
export const onDeleteWaterData = /* GraphQL */ `
  subscription OnDeleteWaterData($owner: String) {
    onDeleteWaterData(owner: $owner) {
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
export const onCreateWeightData = /* GraphQL */ `
  subscription OnCreateWeightData($owner: String) {
    onCreateWeightData(owner: $owner) {
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
export const onUpdateWeightData = /* GraphQL */ `
  subscription OnUpdateWeightData($owner: String) {
    onUpdateWeightData(owner: $owner) {
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
export const onDeleteWeightData = /* GraphQL */ `
  subscription OnDeleteWeightData($owner: String) {
    onDeleteWeightData(owner: $owner) {
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
export const onCreateNewSkillTypeData = /* GraphQL */ `
  subscription OnCreateNewSkillTypeData($owner: String) {
    onCreateNewSkillTypeData(owner: $owner) {
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
export const onUpdateNewSkillTypeData = /* GraphQL */ `
  subscription OnUpdateNewSkillTypeData($owner: String) {
    onUpdateNewSkillTypeData(owner: $owner) {
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
export const onDeleteNewSkillTypeData = /* GraphQL */ `
  subscription OnDeleteNewSkillTypeData($owner: String) {
    onDeleteNewSkillTypeData(owner: $owner) {
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
export const onCreateHabitTypeData = /* GraphQL */ `
  subscription OnCreateHabitTypeData($owner: String) {
    onCreateHabitTypeData(owner: $owner) {
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
export const onUpdateHabitTypeData = /* GraphQL */ `
  subscription OnUpdateHabitTypeData($owner: String) {
    onUpdateHabitTypeData(owner: $owner) {
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
export const onDeleteHabitTypeData = /* GraphQL */ `
  subscription OnDeleteHabitTypeData($owner: String) {
    onDeleteHabitTypeData(owner: $owner) {
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
export const onCreateSleepData = /* GraphQL */ `
  subscription OnCreateSleepData($owner: String) {
    onCreateSleepData(owner: $owner) {
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
export const onUpdateSleepData = /* GraphQL */ `
  subscription OnUpdateSleepData($owner: String) {
    onUpdateSleepData(owner: $owner) {
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
export const onDeleteSleepData = /* GraphQL */ `
  subscription OnDeleteSleepData($owner: String) {
    onDeleteSleepData(owner: $owner) {
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
export const onCreateMeditationData = /* GraphQL */ `
  subscription OnCreateMeditationData($owner: String) {
    onCreateMeditationData(owner: $owner) {
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
export const onUpdateMeditationData = /* GraphQL */ `
  subscription OnUpdateMeditationData($owner: String) {
    onUpdateMeditationData(owner: $owner) {
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
export const onDeleteMeditationData = /* GraphQL */ `
  subscription OnDeleteMeditationData($owner: String) {
    onDeleteMeditationData(owner: $owner) {
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
export const onCreateWaistData = /* GraphQL */ `
  subscription OnCreateWaistData($owner: String) {
    onCreateWaistData(owner: $owner) {
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
export const onUpdateWaistData = /* GraphQL */ `
  subscription OnUpdateWaistData($owner: String) {
    onUpdateWaistData(owner: $owner) {
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
export const onDeleteWaistData = /* GraphQL */ `
  subscription OnDeleteWaistData($owner: String) {
    onDeleteWaistData(owner: $owner) {
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
export const onCreateUserFoodLogger = /* GraphQL */ `
  subscription OnCreateUserFoodLogger($owner: String) {
    onCreateUserFoodLogger(owner: $owner) {
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
export const onUpdateUserFoodLogger = /* GraphQL */ `
  subscription OnUpdateUserFoodLogger($owner: String) {
    onUpdateUserFoodLogger(owner: $owner) {
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
export const onDeleteUserFoodLogger = /* GraphQL */ `
  subscription OnDeleteUserFoodLogger($owner: String) {
    onDeleteUserFoodLogger(owner: $owner) {
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
export const onCreateLevel = /* GraphQL */ `
  subscription OnCreateLevel($owner: String) {
    onCreateLevel(owner: $owner) {
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
export const onUpdateLevel = /* GraphQL */ `
  subscription OnUpdateLevel($owner: String) {
    onUpdateLevel(owner: $owner) {
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
export const onDeleteLevel = /* GraphQL */ `
  subscription OnDeleteLevel($owner: String) {
    onDeleteLevel(owner: $owner) {
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
export const onCreateLevelSystem = /* GraphQL */ `
  subscription OnCreateLevelSystem($owner: String) {
    onCreateLevelSystem(owner: $owner) {
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
export const onUpdateLevelSystem = /* GraphQL */ `
  subscription OnUpdateLevelSystem($owner: String) {
    onUpdateLevelSystem(owner: $owner) {
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
export const onDeleteLevelSystem = /* GraphQL */ `
  subscription OnDeleteLevelSystem($owner: String) {
    onDeleteLevelSystem(owner: $owner) {
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
export const onCreatePoint = /* GraphQL */ `
  subscription OnCreatePoint($owner: String) {
    onCreatePoint(owner: $owner) {
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
export const onUpdatePoint = /* GraphQL */ `
  subscription OnUpdatePoint($owner: String) {
    onUpdatePoint(owner: $owner) {
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
export const onDeletePoint = /* GraphQL */ `
  subscription OnDeletePoint($owner: String) {
    onDeletePoint(owner: $owner) {
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
export const onCreateUserStat = /* GraphQL */ `
  subscription OnCreateUserStat($owner: String) {
    onCreateUserStat(owner: $owner) {
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
export const onUpdateUserStat = /* GraphQL */ `
  subscription OnUpdateUserStat($owner: String) {
    onUpdateUserStat(owner: $owner) {
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
export const onDeleteUserStat = /* GraphQL */ `
  subscription OnDeleteUserStat($owner: String) {
    onDeleteUserStat(owner: $owner) {
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
export const onCreateChallengeSystem = /* GraphQL */ `
  subscription OnCreateChallengeSystem($owner: String) {
    onCreateChallengeSystem(owner: $owner) {
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
export const onUpdateChallengeSystem = /* GraphQL */ `
  subscription OnUpdateChallengeSystem($owner: String) {
    onUpdateChallengeSystem(owner: $owner) {
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
export const onDeleteChallengeSystem = /* GraphQL */ `
  subscription OnDeleteChallengeSystem($owner: String) {
    onDeleteChallengeSystem(owner: $owner) {
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
export const onCreateUserActivateType = /* GraphQL */ `
  subscription OnCreateUserActivateType($owner: String) {
    onCreateUserActivateType(owner: $owner) {
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
export const onUpdateUserActivateType = /* GraphQL */ `
  subscription OnUpdateUserActivateType($owner: String) {
    onUpdateUserActivateType(owner: $owner) {
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
export const onDeleteUserActivateType = /* GraphQL */ `
  subscription OnDeleteUserActivateType($owner: String) {
    onDeleteUserActivateType(owner: $owner) {
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
export const onCreateDietData = /* GraphQL */ `
  subscription OnCreateDietData($owner: String) {
    onCreateDietData(owner: $owner) {
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
export const onUpdateDietData = /* GraphQL */ `
  subscription OnUpdateDietData($owner: String) {
    onUpdateDietData(owner: $owner) {
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
export const onDeleteDietData = /* GraphQL */ `
  subscription OnDeleteDietData($owner: String) {
    onDeleteDietData(owner: $owner) {
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
export const onCreateDietSettings = /* GraphQL */ `
  subscription OnCreateDietSettings($owner: String) {
    onCreateDietSettings(owner: $owner) {
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
export const onUpdateDietSettings = /* GraphQL */ `
  subscription OnUpdateDietSettings($owner: String) {
    onUpdateDietSettings(owner: $owner) {
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
export const onDeleteDietSettings = /* GraphQL */ `
  subscription OnDeleteDietSettings($owner: String) {
    onDeleteDietSettings(owner: $owner) {
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
export const onCreateExercise = /* GraphQL */ `
  subscription OnCreateExercise {
    onCreateExercise {
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
export const onUpdateExercise = /* GraphQL */ `
  subscription OnUpdateExercise {
    onUpdateExercise {
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
export const onDeleteExercise = /* GraphQL */ `
  subscription OnDeleteExercise {
    onDeleteExercise {
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
export const onCreateRoutine = /* GraphQL */ `
  subscription OnCreateRoutine {
    onCreateRoutine {
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
export const onUpdateRoutine = /* GraphQL */ `
  subscription OnUpdateRoutine {
    onUpdateRoutine {
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
export const onDeleteRoutine = /* GraphQL */ `
  subscription OnDeleteRoutine {
    onDeleteRoutine {
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
export const onCreateExerciseRoutine = /* GraphQL */ `
  subscription OnCreateExerciseRoutine {
    onCreateExerciseRoutine {
      id
      routineId
      exerciseId
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
    }
  }
`;
export const onUpdateExerciseRoutine = /* GraphQL */ `
  subscription OnUpdateExerciseRoutine {
    onUpdateExerciseRoutine {
      id
      routineId
      exerciseId
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
    }
  }
`;
export const onDeleteExerciseRoutine = /* GraphQL */ `
  subscription OnDeleteExerciseRoutine {
    onDeleteExerciseRoutine {
      id
      routineId
      exerciseId
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
    }
  }
`;
export const onCreateRoutineData = /* GraphQL */ `
  subscription OnCreateRoutineData($owner: String) {
    onCreateRoutineData(owner: $owner) {
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
export const onUpdateRoutineData = /* GraphQL */ `
  subscription OnUpdateRoutineData($owner: String) {
    onUpdateRoutineData(owner: $owner) {
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
export const onDeleteRoutineData = /* GraphQL */ `
  subscription OnDeleteRoutineData($owner: String) {
    onDeleteRoutineData(owner: $owner) {
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
export const onCreateFavoriteRoutine = /* GraphQL */ `
  subscription OnCreateFavoriteRoutine($owner: String) {
    onCreateFavoriteRoutine(owner: $owner) {
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
export const onUpdateFavoriteRoutine = /* GraphQL */ `
  subscription OnUpdateFavoriteRoutine($owner: String) {
    onUpdateFavoriteRoutine(owner: $owner) {
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
export const onDeleteFavoriteRoutine = /* GraphQL */ `
  subscription OnDeleteFavoriteRoutine($owner: String) {
    onDeleteFavoriteRoutine(owner: $owner) {
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
export const onCreateUserExerciseStat = /* GraphQL */ `
  subscription OnCreateUserExerciseStat($owner: String) {
    onCreateUserExerciseStat(owner: $owner) {
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
export const onUpdateUserExerciseStat = /* GraphQL */ `
  subscription OnUpdateUserExerciseStat($owner: String) {
    onUpdateUserExerciseStat(owner: $owner) {
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
export const onDeleteUserExerciseStat = /* GraphQL */ `
  subscription OnDeleteUserExerciseStat($owner: String) {
    onDeleteUserExerciseStat(owner: $owner) {
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
export const onCreateExertionData = /* GraphQL */ `
  subscription OnCreateExertionData($owner: String) {
    onCreateExertionData(owner: $owner) {
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
export const onUpdateExertionData = /* GraphQL */ `
  subscription OnUpdateExertionData($owner: String) {
    onUpdateExertionData(owner: $owner) {
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
export const onDeleteExertionData = /* GraphQL */ `
  subscription OnDeleteExertionData($owner: String) {
    onDeleteExertionData(owner: $owner) {
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
export const onCreateDailyToDo = /* GraphQL */ `
  subscription OnCreateDailyToDo($owner: String!) {
    onCreateDailyToDo(owner: $owner) {
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
export const onUpdateDailyToDo = /* GraphQL */ `
  subscription OnUpdateDailyToDo($owner: String!) {
    onUpdateDailyToDo(owner: $owner) {
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
export const onDeleteDailyToDo = /* GraphQL */ `
  subscription OnDeleteDailyToDo($owner: String!) {
    onDeleteDailyToDo(owner: $owner) {
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
export const onCreateScheduleToDo = /* GraphQL */ `
  subscription OnCreateScheduleToDo($owner: String!) {
    onCreateScheduleToDo(owner: $owner) {
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
export const onUpdateScheduleToDo = /* GraphQL */ `
  subscription OnUpdateScheduleToDo($owner: String!) {
    onUpdateScheduleToDo(owner: $owner) {
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
export const onDeleteScheduleToDo = /* GraphQL */ `
  subscription OnDeleteScheduleToDo($owner: String!) {
    onDeleteScheduleToDo(owner: $owner) {
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
export const onCreateMasterToDo = /* GraphQL */ `
  subscription OnCreateMasterToDo($owner: String!) {
    onCreateMasterToDo(owner: $owner) {
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
export const onUpdateMasterToDo = /* GraphQL */ `
  subscription OnUpdateMasterToDo($owner: String!) {
    onUpdateMasterToDo(owner: $owner) {
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
export const onDeleteMasterToDo = /* GraphQL */ `
  subscription OnDeleteMasterToDo($owner: String!) {
    onDeleteMasterToDo(owner: $owner) {
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
export const onCreateWeeklyToDo = /* GraphQL */ `
  subscription OnCreateWeeklyToDo($owner: String!) {
    onCreateWeeklyToDo(owner: $owner) {
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
export const onUpdateWeeklyToDo = /* GraphQL */ `
  subscription OnUpdateWeeklyToDo($owner: String!) {
    onUpdateWeeklyToDo(owner: $owner) {
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
export const onDeleteWeeklyToDo = /* GraphQL */ `
  subscription OnDeleteWeeklyToDo($owner: String!) {
    onDeleteWeeklyToDo(owner: $owner) {
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
export const onCreateGroceryToDo = /* GraphQL */ `
  subscription OnCreateGroceryToDo($owner: String!) {
    onCreateGroceryToDo(owner: $owner) {
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
export const onUpdateGroceryToDo = /* GraphQL */ `
  subscription OnUpdateGroceryToDo($owner: String!) {
    onUpdateGroceryToDo(owner: $owner) {
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
export const onDeleteGroceryToDo = /* GraphQL */ `
  subscription OnDeleteGroceryToDo($owner: String!) {
    onDeleteGroceryToDo(owner: $owner) {
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
