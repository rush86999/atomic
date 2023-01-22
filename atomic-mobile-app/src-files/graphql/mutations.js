/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createUserProfile = /* GraphQL */ `
  mutation CreateUserProfile(
    $input: CreateUserProfileInput!
    $condition: ModelUserProfileConditionInput
  ) {
    createUserProfile(input: $input, condition: $condition) {
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
export const updateUserProfile = /* GraphQL */ `
  mutation UpdateUserProfile(
    $input: UpdateUserProfileInput!
    $condition: ModelUserProfileConditionInput
  ) {
    updateUserProfile(input: $input, condition: $condition) {
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
export const deleteUserProfile = /* GraphQL */ `
  mutation DeleteUserProfile(
    $input: DeleteUserProfileInput!
    $condition: ModelUserProfileConditionInput
  ) {
    deleteUserProfile(input: $input, condition: $condition) {
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
export const createFollower = /* GraphQL */ `
  mutation CreateFollower(
    $input: CreateFollowerInput!
    $condition: ModelFollowerConditionInput
  ) {
    createFollower(input: $input, condition: $condition) {
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
export const updateFollower = /* GraphQL */ `
  mutation UpdateFollower(
    $input: UpdateFollowerInput!
    $condition: ModelFollowerConditionInput
  ) {
    updateFollower(input: $input, condition: $condition) {
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
export const deleteFollower = /* GraphQL */ `
  mutation DeleteFollower(
    $input: DeleteFollowerInput!
    $condition: ModelFollowerConditionInput
  ) {
    deleteFollower(input: $input, condition: $condition) {
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
export const createFollowing = /* GraphQL */ `
  mutation CreateFollowing(
    $input: CreateFollowingInput!
    $condition: ModelFollowingConditionInput
  ) {
    createFollowing(input: $input, condition: $condition) {
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
export const updateFollowing = /* GraphQL */ `
  mutation UpdateFollowing(
    $input: UpdateFollowingInput!
    $condition: ModelFollowingConditionInput
  ) {
    updateFollowing(input: $input, condition: $condition) {
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
export const deleteFollowing = /* GraphQL */ `
  mutation DeleteFollowing(
    $input: DeleteFollowingInput!
    $condition: ModelFollowingConditionInput
  ) {
    deleteFollowing(input: $input, condition: $condition) {
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
export const createArticle = /* GraphQL */ `
  mutation CreateArticle(
    $input: CreateArticleInput!
    $condition: ModelArticleConditionInput
  ) {
    createArticle(input: $input, condition: $condition) {
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
export const updateArticle = /* GraphQL */ `
  mutation UpdateArticle(
    $input: UpdateArticleInput!
    $condition: ModelArticleConditionInput
  ) {
    updateArticle(input: $input, condition: $condition) {
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
export const deleteArticle = /* GraphQL */ `
  mutation DeleteArticle(
    $input: DeleteArticleInput!
    $condition: ModelArticleConditionInput
  ) {
    deleteArticle(input: $input, condition: $condition) {
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
export const createPost = /* GraphQL */ `
  mutation CreatePost(
    $input: CreatePostInput!
    $condition: ModelPostConditionInput
  ) {
    createPost(input: $input, condition: $condition) {
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
export const updatePost = /* GraphQL */ `
  mutation UpdatePost(
    $input: UpdatePostInput!
    $condition: ModelPostConditionInput
  ) {
    updatePost(input: $input, condition: $condition) {
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
export const deletePost = /* GraphQL */ `
  mutation DeletePost(
    $input: DeletePostInput!
    $condition: ModelPostConditionInput
  ) {
    deletePost(input: $input, condition: $condition) {
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
export const createArticleTag = /* GraphQL */ `
  mutation CreateArticleTag(
    $input: CreateArticleTagInput!
    $condition: ModelArticleTagConditionInput
  ) {
    createArticleTag(input: $input, condition: $condition) {
      id
      postId
      articleId
      tagId
      post {
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
      tag {
        id
        name
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
      }
      article {
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
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
    }
  }
`;
export const updateArticleTag = /* GraphQL */ `
  mutation UpdateArticleTag(
    $input: UpdateArticleTagInput!
    $condition: ModelArticleTagConditionInput
  ) {
    updateArticleTag(input: $input, condition: $condition) {
      id
      postId
      articleId
      tagId
      post {
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
      tag {
        id
        name
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
      }
      article {
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
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
    }
  }
`;
export const deleteArticleTag = /* GraphQL */ `
  mutation DeleteArticleTag(
    $input: DeleteArticleTagInput!
    $condition: ModelArticleTagConditionInput
  ) {
    deleteArticleTag(input: $input, condition: $condition) {
      id
      postId
      articleId
      tagId
      post {
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
      tag {
        id
        name
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
      }
      article {
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
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
    }
  }
`;
export const createTag = /* GraphQL */ `
  mutation CreateTag(
    $input: CreateTagInput!
    $condition: ModelTagConditionInput
  ) {
    createTag(input: $input, condition: $condition) {
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
export const updateTag = /* GraphQL */ `
  mutation UpdateTag(
    $input: UpdateTagInput!
    $condition: ModelTagConditionInput
  ) {
    updateTag(input: $input, condition: $condition) {
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
export const deleteTag = /* GraphQL */ `
  mutation DeleteTag(
    $input: DeleteTagInput!
    $condition: ModelTagConditionInput
  ) {
    deleteTag(input: $input, condition: $condition) {
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
export const createComment = /* GraphQL */ `
  mutation CreateComment(
    $input: CreateCommentInput!
    $condition: ModelCommentConditionInput
  ) {
    createComment(input: $input, condition: $condition) {
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
export const updateComment = /* GraphQL */ `
  mutation UpdateComment(
    $input: UpdateCommentInput!
    $condition: ModelCommentConditionInput
  ) {
    updateComment(input: $input, condition: $condition) {
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
export const deleteComment = /* GraphQL */ `
  mutation DeleteComment(
    $input: DeleteCommentInput!
    $condition: ModelCommentConditionInput
  ) {
    deleteComment(input: $input, condition: $condition) {
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
export const createPostLike = /* GraphQL */ `
  mutation CreatePostLike(
    $input: CreatePostLikeInput!
    $condition: ModelPostLikeConditionInput
  ) {
    createPostLike(input: $input, condition: $condition) {
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
export const updatePostLike = /* GraphQL */ `
  mutation UpdatePostLike(
    $input: UpdatePostLikeInput!
    $condition: ModelPostLikeConditionInput
  ) {
    updatePostLike(input: $input, condition: $condition) {
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
export const deletePostLike = /* GraphQL */ `
  mutation DeletePostLike(
    $input: DeletePostLikeInput!
    $condition: ModelPostLikeConditionInput
  ) {
    deletePostLike(input: $input, condition: $condition) {
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
export const createPointSystem = /* GraphQL */ `
  mutation CreatePointSystem(
    $input: CreatePointSystemInput!
    $condition: ModelPointSystemConditionInput
  ) {
    createPointSystem(input: $input, condition: $condition) {
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
export const updatePointSystem = /* GraphQL */ `
  mutation UpdatePointSystem(
    $input: UpdatePointSystemInput!
    $condition: ModelPointSystemConditionInput
  ) {
    updatePointSystem(input: $input, condition: $condition) {
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
export const deletePointSystem = /* GraphQL */ `
  mutation DeletePointSystem(
    $input: DeletePointSystemInput!
    $condition: ModelPointSystemConditionInput
  ) {
    deletePointSystem(input: $input, condition: $condition) {
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
export const createUser = /* GraphQL */ `
  mutation CreateUser(
    $input: CreateUserInput!
    $condition: ModelUserConditionInput
  ) {
    createUser(input: $input, condition: $condition) {
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
export const updateUser = /* GraphQL */ `
  mutation UpdateUser(
    $input: UpdateUserInput!
    $condition: ModelUserConditionInput
  ) {
    updateUser(input: $input, condition: $condition) {
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
export const deleteUser = /* GraphQL */ `
  mutation DeleteUser(
    $input: DeleteUserInput!
    $condition: ModelUserConditionInput
  ) {
    deleteUser(input: $input, condition: $condition) {
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
export const createSettings = /* GraphQL */ `
  mutation CreateSettings(
    $input: CreateSettingsInput!
    $condition: ModelSettingsConditionInput
  ) {
    createSettings(input: $input, condition: $condition) {
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
export const updateSettings = /* GraphQL */ `
  mutation UpdateSettings(
    $input: UpdateSettingsInput!
    $condition: ModelSettingsConditionInput
  ) {
    updateSettings(input: $input, condition: $condition) {
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
export const deleteSettings = /* GraphQL */ `
  mutation DeleteSettings(
    $input: DeleteSettingsInput!
    $condition: ModelSettingsConditionInput
  ) {
    deleteSettings(input: $input, condition: $condition) {
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
export const createMealPreferences = /* GraphQL */ `
  mutation CreateMealPreferences(
    $input: CreateMealPreferencesInput!
    $condition: ModelMealPreferencesConditionInput
  ) {
    createMealPreferences(input: $input, condition: $condition) {
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
export const updateMealPreferences = /* GraphQL */ `
  mutation UpdateMealPreferences(
    $input: UpdateMealPreferencesInput!
    $condition: ModelMealPreferencesConditionInput
  ) {
    updateMealPreferences(input: $input, condition: $condition) {
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
export const deleteMealPreferences = /* GraphQL */ `
  mutation DeleteMealPreferences(
    $input: DeleteMealPreferencesInput!
    $condition: ModelMealPreferencesConditionInput
  ) {
    deleteMealPreferences(input: $input, condition: $condition) {
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
export const createNotifications = /* GraphQL */ `
  mutation CreateNotifications(
    $input: CreateNotificationsInput!
    $condition: ModelNotificationsConditionInput
  ) {
    createNotifications(input: $input, condition: $condition) {
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
export const updateNotifications = /* GraphQL */ `
  mutation UpdateNotifications(
    $input: UpdateNotificationsInput!
    $condition: ModelNotificationsConditionInput
  ) {
    updateNotifications(input: $input, condition: $condition) {
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
export const deleteNotifications = /* GraphQL */ `
  mutation DeleteNotifications(
    $input: DeleteNotificationsInput!
    $condition: ModelNotificationsConditionInput
  ) {
    deleteNotifications(input: $input, condition: $condition) {
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
export const createPlan = /* GraphQL */ `
  mutation CreatePlan(
    $input: CreatePlanInput!
    $condition: ModelPlanConditionInput
  ) {
    createPlan(input: $input, condition: $condition) {
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
export const updatePlan = /* GraphQL */ `
  mutation UpdatePlan(
    $input: UpdatePlanInput!
    $condition: ModelPlanConditionInput
  ) {
    updatePlan(input: $input, condition: $condition) {
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
export const deletePlan = /* GraphQL */ `
  mutation DeletePlan(
    $input: DeletePlanInput!
    $condition: ModelPlanConditionInput
  ) {
    deletePlan(input: $input, condition: $condition) {
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
export const createRecipeFavorite = /* GraphQL */ `
  mutation CreateRecipeFavorite(
    $input: CreateRecipeFavoriteInput!
    $condition: ModelRecipeFavoriteConditionInput
  ) {
    createRecipeFavorite(input: $input, condition: $condition) {
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
export const updateRecipeFavorite = /* GraphQL */ `
  mutation UpdateRecipeFavorite(
    $input: UpdateRecipeFavoriteInput!
    $condition: ModelRecipeFavoriteConditionInput
  ) {
    updateRecipeFavorite(input: $input, condition: $condition) {
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
export const deleteRecipeFavorite = /* GraphQL */ `
  mutation DeleteRecipeFavorite(
    $input: DeleteRecipeFavoriteInput!
    $condition: ModelRecipeFavoriteConditionInput
  ) {
    deleteRecipeFavorite(input: $input, condition: $condition) {
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
export const createFavoriteMeal = /* GraphQL */ `
  mutation CreateFavoriteMeal(
    $input: CreateFavoriteMealInput!
    $condition: ModelFavoriteMealConditionInput
  ) {
    createFavoriteMeal(input: $input, condition: $condition) {
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
export const updateFavoriteMeal = /* GraphQL */ `
  mutation UpdateFavoriteMeal(
    $input: UpdateFavoriteMealInput!
    $condition: ModelFavoriteMealConditionInput
  ) {
    updateFavoriteMeal(input: $input, condition: $condition) {
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
export const deleteFavoriteMeal = /* GraphQL */ `
  mutation DeleteFavoriteMeal(
    $input: DeleteFavoriteMealInput!
    $condition: ModelFavoriteMealConditionInput
  ) {
    deleteFavoriteMeal(input: $input, condition: $condition) {
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
export const createUserMealLogger = /* GraphQL */ `
  mutation CreateUserMealLogger(
    $input: CreateUserMealLoggerInput!
    $condition: ModelUserMealLoggerConditionInput
  ) {
    createUserMealLogger(input: $input, condition: $condition) {
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
export const updateUserMealLogger = /* GraphQL */ `
  mutation UpdateUserMealLogger(
    $input: UpdateUserMealLoggerInput!
    $condition: ModelUserMealLoggerConditionInput
  ) {
    updateUserMealLogger(input: $input, condition: $condition) {
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
export const deleteUserMealLogger = /* GraphQL */ `
  mutation DeleteUserMealLogger(
    $input: DeleteUserMealLoggerInput!
    $condition: ModelUserMealLoggerConditionInput
  ) {
    deleteUserMealLogger(input: $input, condition: $condition) {
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
export const createMembership = /* GraphQL */ `
  mutation CreateMembership(
    $input: CreateMembershipInput!
    $condition: ModelMembershipConditionInput
  ) {
    createMembership(input: $input, condition: $condition) {
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
export const updateMembership = /* GraphQL */ `
  mutation UpdateMembership(
    $input: UpdateMembershipInput!
    $condition: ModelMembershipConditionInput
  ) {
    updateMembership(input: $input, condition: $condition) {
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
export const deleteMembership = /* GraphQL */ `
  mutation DeleteMembership(
    $input: DeleteMembershipInput!
    $condition: ModelMembershipConditionInput
  ) {
    deleteMembership(input: $input, condition: $condition) {
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
export const createactive_subscription = /* GraphQL */ `
  mutation Createactive_subscription(
    $input: Createactive_subscriptionInput!
    $condition: Modelactive_subscriptionConditionInput
  ) {
    createactive_subscription(input: $input, condition: $condition) {
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
export const updateactive_subscription = /* GraphQL */ `
  mutation Updateactive_subscription(
    $input: Updateactive_subscriptionInput!
    $condition: Modelactive_subscriptionConditionInput
  ) {
    updateactive_subscription(input: $input, condition: $condition) {
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
export const deleteactive_subscription = /* GraphQL */ `
  mutation Deleteactive_subscription(
    $input: Deleteactive_subscriptionInput!
    $condition: Modelactive_subscriptionConditionInput
  ) {
    deleteactive_subscription(input: $input, condition: $condition) {
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
export const createPaidSubscription = /* GraphQL */ `
  mutation CreatePaidSubscription(
    $input: CreatePaidSubscriptionInput!
    $condition: ModelPaidSubscriptionConditionInput
  ) {
    createPaidSubscription(input: $input, condition: $condition) {
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
export const updatePaidSubscription = /* GraphQL */ `
  mutation UpdatePaidSubscription(
    $input: UpdatePaidSubscriptionInput!
    $condition: ModelPaidSubscriptionConditionInput
  ) {
    updatePaidSubscription(input: $input, condition: $condition) {
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
export const deletePaidSubscription = /* GraphQL */ `
  mutation DeletePaidSubscription(
    $input: DeletePaidSubscriptionInput!
    $condition: ModelPaidSubscriptionConditionInput
  ) {
    deletePaidSubscription(input: $input, condition: $condition) {
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
export const createUserTransaction = /* GraphQL */ `
  mutation CreateUserTransaction(
    $input: CreateUserTransactionInput!
    $condition: ModelUserTransactionConditionInput
  ) {
    createUserTransaction(input: $input, condition: $condition) {
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
export const updateUserTransaction = /* GraphQL */ `
  mutation UpdateUserTransaction(
    $input: UpdateUserTransactionInput!
    $condition: ModelUserTransactionConditionInput
  ) {
    updateUserTransaction(input: $input, condition: $condition) {
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
export const deleteUserTransaction = /* GraphQL */ `
  mutation DeleteUserTransaction(
    $input: DeleteUserTransactionInput!
    $condition: ModelUserTransactionConditionInput
  ) {
    deleteUserTransaction(input: $input, condition: $condition) {
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
export const createSavedRecipeSearch = /* GraphQL */ `
  mutation CreateSavedRecipeSearch(
    $input: CreateSavedRecipeSearchInput!
    $condition: ModelSavedRecipeSearchConditionInput
  ) {
    createSavedRecipeSearch(input: $input, condition: $condition) {
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
export const updateSavedRecipeSearch = /* GraphQL */ `
  mutation UpdateSavedRecipeSearch(
    $input: UpdateSavedRecipeSearchInput!
    $condition: ModelSavedRecipeSearchConditionInput
  ) {
    updateSavedRecipeSearch(input: $input, condition: $condition) {
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
export const deleteSavedRecipeSearch = /* GraphQL */ `
  mutation DeleteSavedRecipeSearch(
    $input: DeleteSavedRecipeSearchInput!
    $condition: ModelSavedRecipeSearchConditionInput
  ) {
    deleteSavedRecipeSearch(input: $input, condition: $condition) {
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
export const createShoppingList = /* GraphQL */ `
  mutation CreateShoppingList(
    $input: CreateShoppingListInput!
    $condition: ModelShoppingListConditionInput
  ) {
    createShoppingList(input: $input, condition: $condition) {
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
export const updateShoppingList = /* GraphQL */ `
  mutation UpdateShoppingList(
    $input: UpdateShoppingListInput!
    $condition: ModelShoppingListConditionInput
  ) {
    updateShoppingList(input: $input, condition: $condition) {
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
export const deleteShoppingList = /* GraphQL */ `
  mutation DeleteShoppingList(
    $input: DeleteShoppingListInput!
    $condition: ModelShoppingListConditionInput
  ) {
    deleteShoppingList(input: $input, condition: $condition) {
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
export const createRecipe = /* GraphQL */ `
  mutation CreateRecipe(
    $input: CreateRecipeInput!
    $condition: ModelRecipeConditionInput
  ) {
    createRecipe(input: $input, condition: $condition) {
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
export const updateRecipe = /* GraphQL */ `
  mutation UpdateRecipe(
    $input: UpdateRecipeInput!
    $condition: ModelRecipeConditionInput
  ) {
    updateRecipe(input: $input, condition: $condition) {
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
export const deleteRecipe = /* GraphQL */ `
  mutation DeleteRecipe(
    $input: DeleteRecipeInput!
    $condition: ModelRecipeConditionInput
  ) {
    deleteRecipe(input: $input, condition: $condition) {
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
export const createSchedule = /* GraphQL */ `
  mutation CreateSchedule(
    $input: CreateScheduleInput!
    $condition: ModelScheduleConditionInput
  ) {
    createSchedule(input: $input, condition: $condition) {
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
export const updateSchedule = /* GraphQL */ `
  mutation UpdateSchedule(
    $input: UpdateScheduleInput!
    $condition: ModelScheduleConditionInput
  ) {
    updateSchedule(input: $input, condition: $condition) {
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
export const deleteSchedule = /* GraphQL */ `
  mutation DeleteSchedule(
    $input: DeleteScheduleInput!
    $condition: ModelScheduleConditionInput
  ) {
    deleteSchedule(input: $input, condition: $condition) {
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
export const createStreak = /* GraphQL */ `
  mutation CreateStreak(
    $input: CreateStreakInput!
    $condition: ModelStreakConditionInput
  ) {
    createStreak(input: $input, condition: $condition) {
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
export const updateStreak = /* GraphQL */ `
  mutation UpdateStreak(
    $input: UpdateStreakInput!
    $condition: ModelStreakConditionInput
  ) {
    updateStreak(input: $input, condition: $condition) {
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
export const deleteStreak = /* GraphQL */ `
  mutation DeleteStreak(
    $input: DeleteStreakInput!
    $condition: ModelStreakConditionInput
  ) {
    deleteStreak(input: $input, condition: $condition) {
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
export const createRecipeDatabase = /* GraphQL */ `
  mutation CreateRecipeDatabase(
    $input: CreateRecipeDatabaseInput!
    $condition: ModelRecipeDatabaseConditionInput
  ) {
    createRecipeDatabase(input: $input, condition: $condition) {
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
export const updateRecipeDatabase = /* GraphQL */ `
  mutation UpdateRecipeDatabase(
    $input: UpdateRecipeDatabaseInput!
    $condition: ModelRecipeDatabaseConditionInput
  ) {
    updateRecipeDatabase(input: $input, condition: $condition) {
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
export const deleteRecipeDatabase = /* GraphQL */ `
  mutation DeleteRecipeDatabase(
    $input: DeleteRecipeDatabaseInput!
    $condition: ModelRecipeDatabaseConditionInput
  ) {
    deleteRecipeDatabase(input: $input, condition: $condition) {
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
export const createMealPlan = /* GraphQL */ `
  mutation CreateMealPlan(
    $input: CreateMealPlanInput!
    $condition: ModelMealPlanConditionInput
  ) {
    createMealPlan(input: $input, condition: $condition) {
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
export const updateMealPlan = /* GraphQL */ `
  mutation UpdateMealPlan(
    $input: UpdateMealPlanInput!
    $condition: ModelMealPlanConditionInput
  ) {
    updateMealPlan(input: $input, condition: $condition) {
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
export const deleteMealPlan = /* GraphQL */ `
  mutation DeleteMealPlan(
    $input: DeleteMealPlanInput!
    $condition: ModelMealPlanConditionInput
  ) {
    deleteMealPlan(input: $input, condition: $condition) {
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
export const createGoal = /* GraphQL */ `
  mutation CreateGoal(
    $input: CreateGoalInput!
    $condition: ModelGoalConditionInput
  ) {
    createGoal(input: $input, condition: $condition) {
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
export const updateGoal = /* GraphQL */ `
  mutation UpdateGoal(
    $input: UpdateGoalInput!
    $condition: ModelGoalConditionInput
  ) {
    updateGoal(input: $input, condition: $condition) {
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
export const deleteGoal = /* GraphQL */ `
  mutation DeleteGoal(
    $input: DeleteGoalInput!
    $condition: ModelGoalConditionInput
  ) {
    deleteGoal(input: $input, condition: $condition) {
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
export const createGoalExercise = /* GraphQL */ `
  mutation CreateGoalExercise(
    $input: CreateGoalExerciseInput!
    $condition: ModelGoalExerciseConditionInput
  ) {
    createGoalExercise(input: $input, condition: $condition) {
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
export const updateGoalExercise = /* GraphQL */ `
  mutation UpdateGoalExercise(
    $input: UpdateGoalExerciseInput!
    $condition: ModelGoalExerciseConditionInput
  ) {
    updateGoalExercise(input: $input, condition: $condition) {
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
export const deleteGoalExercise = /* GraphQL */ `
  mutation DeleteGoalExercise(
    $input: DeleteGoalExerciseInput!
    $condition: ModelGoalExerciseConditionInput
  ) {
    deleteGoalExercise(input: $input, condition: $condition) {
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
export const createBackgroundTask = /* GraphQL */ `
  mutation CreateBackgroundTask(
    $input: CreateBackgroundTaskInput!
    $condition: ModelBackgroundTaskConditionInput
  ) {
    createBackgroundTask(input: $input, condition: $condition) {
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
export const updateBackgroundTask = /* GraphQL */ `
  mutation UpdateBackgroundTask(
    $input: UpdateBackgroundTaskInput!
    $condition: ModelBackgroundTaskConditionInput
  ) {
    updateBackgroundTask(input: $input, condition: $condition) {
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
export const deleteBackgroundTask = /* GraphQL */ `
  mutation DeleteBackgroundTask(
    $input: DeleteBackgroundTaskInput!
    $condition: ModelBackgroundTaskConditionInput
  ) {
    deleteBackgroundTask(input: $input, condition: $condition) {
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
export const createBackgroundTimer = /* GraphQL */ `
  mutation CreateBackgroundTimer(
    $input: CreateBackgroundTimerInput!
    $condition: ModelBackgroundTimerConditionInput
  ) {
    createBackgroundTimer(input: $input, condition: $condition) {
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
export const updateBackgroundTimer = /* GraphQL */ `
  mutation UpdateBackgroundTimer(
    $input: UpdateBackgroundTimerInput!
    $condition: ModelBackgroundTimerConditionInput
  ) {
    updateBackgroundTimer(input: $input, condition: $condition) {
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
export const deleteBackgroundTimer = /* GraphQL */ `
  mutation DeleteBackgroundTimer(
    $input: DeleteBackgroundTimerInput!
    $condition: ModelBackgroundTimerConditionInput
  ) {
    deleteBackgroundTimer(input: $input, condition: $condition) {
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
export const createFruitData = /* GraphQL */ `
  mutation CreateFruitData(
    $input: CreateFruitDataInput!
    $condition: ModelFruitDataConditionInput
  ) {
    createFruitData(input: $input, condition: $condition) {
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
export const updateFruitData = /* GraphQL */ `
  mutation UpdateFruitData(
    $input: UpdateFruitDataInput!
    $condition: ModelFruitDataConditionInput
  ) {
    updateFruitData(input: $input, condition: $condition) {
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
export const deleteFruitData = /* GraphQL */ `
  mutation DeleteFruitData(
    $input: DeleteFruitDataInput!
    $condition: ModelFruitDataConditionInput
  ) {
    deleteFruitData(input: $input, condition: $condition) {
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
export const createVegetableData = /* GraphQL */ `
  mutation CreateVegetableData(
    $input: CreateVegetableDataInput!
    $condition: ModelVegetableDataConditionInput
  ) {
    createVegetableData(input: $input, condition: $condition) {
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
export const updateVegetableData = /* GraphQL */ `
  mutation UpdateVegetableData(
    $input: UpdateVegetableDataInput!
    $condition: ModelVegetableDataConditionInput
  ) {
    updateVegetableData(input: $input, condition: $condition) {
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
export const deleteVegetableData = /* GraphQL */ `
  mutation DeleteVegetableData(
    $input: DeleteVegetableDataInput!
    $condition: ModelVegetableDataConditionInput
  ) {
    deleteVegetableData(input: $input, condition: $condition) {
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
export const createStepData = /* GraphQL */ `
  mutation CreateStepData(
    $input: CreateStepDataInput!
    $condition: ModelStepDataConditionInput
  ) {
    createStepData(input: $input, condition: $condition) {
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
export const updateStepData = /* GraphQL */ `
  mutation UpdateStepData(
    $input: UpdateStepDataInput!
    $condition: ModelStepDataConditionInput
  ) {
    updateStepData(input: $input, condition: $condition) {
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
export const deleteStepData = /* GraphQL */ `
  mutation DeleteStepData(
    $input: DeleteStepDataInput!
    $condition: ModelStepDataConditionInput
  ) {
    deleteStepData(input: $input, condition: $condition) {
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
export const createStrengthData = /* GraphQL */ `
  mutation CreateStrengthData(
    $input: CreateStrengthDataInput!
    $condition: ModelStrengthDataConditionInput
  ) {
    createStrengthData(input: $input, condition: $condition) {
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
export const updateStrengthData = /* GraphQL */ `
  mutation UpdateStrengthData(
    $input: UpdateStrengthDataInput!
    $condition: ModelStrengthDataConditionInput
  ) {
    updateStrengthData(input: $input, condition: $condition) {
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
export const deleteStrengthData = /* GraphQL */ `
  mutation DeleteStrengthData(
    $input: DeleteStrengthDataInput!
    $condition: ModelStrengthDataConditionInput
  ) {
    deleteStrengthData(input: $input, condition: $condition) {
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
export const createEnduranceData = /* GraphQL */ `
  mutation CreateEnduranceData(
    $input: CreateEnduranceDataInput!
    $condition: ModelEnduranceDataConditionInput
  ) {
    createEnduranceData(input: $input, condition: $condition) {
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
export const updateEnduranceData = /* GraphQL */ `
  mutation UpdateEnduranceData(
    $input: UpdateEnduranceDataInput!
    $condition: ModelEnduranceDataConditionInput
  ) {
    updateEnduranceData(input: $input, condition: $condition) {
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
export const deleteEnduranceData = /* GraphQL */ `
  mutation DeleteEnduranceData(
    $input: DeleteEnduranceDataInput!
    $condition: ModelEnduranceDataConditionInput
  ) {
    deleteEnduranceData(input: $input, condition: $condition) {
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
export const createGenericExerciseData = /* GraphQL */ `
  mutation CreateGenericExerciseData(
    $input: CreateGenericExerciseDataInput!
    $condition: ModelGenericExerciseDataConditionInput
  ) {
    createGenericExerciseData(input: $input, condition: $condition) {
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
export const updateGenericExerciseData = /* GraphQL */ `
  mutation UpdateGenericExerciseData(
    $input: UpdateGenericExerciseDataInput!
    $condition: ModelGenericExerciseDataConditionInput
  ) {
    updateGenericExerciseData(input: $input, condition: $condition) {
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
export const deleteGenericExerciseData = /* GraphQL */ `
  mutation DeleteGenericExerciseData(
    $input: DeleteGenericExerciseDataInput!
    $condition: ModelGenericExerciseDataConditionInput
  ) {
    deleteGenericExerciseData(input: $input, condition: $condition) {
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
export const createWaterData = /* GraphQL */ `
  mutation CreateWaterData(
    $input: CreateWaterDataInput!
    $condition: ModelWaterDataConditionInput
  ) {
    createWaterData(input: $input, condition: $condition) {
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
export const updateWaterData = /* GraphQL */ `
  mutation UpdateWaterData(
    $input: UpdateWaterDataInput!
    $condition: ModelWaterDataConditionInput
  ) {
    updateWaterData(input: $input, condition: $condition) {
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
export const deleteWaterData = /* GraphQL */ `
  mutation DeleteWaterData(
    $input: DeleteWaterDataInput!
    $condition: ModelWaterDataConditionInput
  ) {
    deleteWaterData(input: $input, condition: $condition) {
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
export const createWeightData = /* GraphQL */ `
  mutation CreateWeightData(
    $input: CreateWeightDataInput!
    $condition: ModelWeightDataConditionInput
  ) {
    createWeightData(input: $input, condition: $condition) {
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
export const updateWeightData = /* GraphQL */ `
  mutation UpdateWeightData(
    $input: UpdateWeightDataInput!
    $condition: ModelWeightDataConditionInput
  ) {
    updateWeightData(input: $input, condition: $condition) {
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
export const deleteWeightData = /* GraphQL */ `
  mutation DeleteWeightData(
    $input: DeleteWeightDataInput!
    $condition: ModelWeightDataConditionInput
  ) {
    deleteWeightData(input: $input, condition: $condition) {
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
export const createNewSkillTypeData = /* GraphQL */ `
  mutation CreateNewSkillTypeData(
    $input: CreateNewSkillTypeDataInput!
    $condition: ModelNewSkillTypeDataConditionInput
  ) {
    createNewSkillTypeData(input: $input, condition: $condition) {
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
export const updateNewSkillTypeData = /* GraphQL */ `
  mutation UpdateNewSkillTypeData(
    $input: UpdateNewSkillTypeDataInput!
    $condition: ModelNewSkillTypeDataConditionInput
  ) {
    updateNewSkillTypeData(input: $input, condition: $condition) {
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
export const deleteNewSkillTypeData = /* GraphQL */ `
  mutation DeleteNewSkillTypeData(
    $input: DeleteNewSkillTypeDataInput!
    $condition: ModelNewSkillTypeDataConditionInput
  ) {
    deleteNewSkillTypeData(input: $input, condition: $condition) {
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
export const createHabitTypeData = /* GraphQL */ `
  mutation CreateHabitTypeData(
    $input: CreateHabitTypeDataInput!
    $condition: ModelHabitTypeDataConditionInput
  ) {
    createHabitTypeData(input: $input, condition: $condition) {
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
export const updateHabitTypeData = /* GraphQL */ `
  mutation UpdateHabitTypeData(
    $input: UpdateHabitTypeDataInput!
    $condition: ModelHabitTypeDataConditionInput
  ) {
    updateHabitTypeData(input: $input, condition: $condition) {
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
export const deleteHabitTypeData = /* GraphQL */ `
  mutation DeleteHabitTypeData(
    $input: DeleteHabitTypeDataInput!
    $condition: ModelHabitTypeDataConditionInput
  ) {
    deleteHabitTypeData(input: $input, condition: $condition) {
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
export const createSleepData = /* GraphQL */ `
  mutation CreateSleepData(
    $input: CreateSleepDataInput!
    $condition: ModelSleepDataConditionInput
  ) {
    createSleepData(input: $input, condition: $condition) {
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
export const updateSleepData = /* GraphQL */ `
  mutation UpdateSleepData(
    $input: UpdateSleepDataInput!
    $condition: ModelSleepDataConditionInput
  ) {
    updateSleepData(input: $input, condition: $condition) {
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
export const deleteSleepData = /* GraphQL */ `
  mutation DeleteSleepData(
    $input: DeleteSleepDataInput!
    $condition: ModelSleepDataConditionInput
  ) {
    deleteSleepData(input: $input, condition: $condition) {
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
export const createMeditationData = /* GraphQL */ `
  mutation CreateMeditationData(
    $input: CreateMeditationDataInput!
    $condition: ModelMeditationDataConditionInput
  ) {
    createMeditationData(input: $input, condition: $condition) {
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
export const updateMeditationData = /* GraphQL */ `
  mutation UpdateMeditationData(
    $input: UpdateMeditationDataInput!
    $condition: ModelMeditationDataConditionInput
  ) {
    updateMeditationData(input: $input, condition: $condition) {
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
export const deleteMeditationData = /* GraphQL */ `
  mutation DeleteMeditationData(
    $input: DeleteMeditationDataInput!
    $condition: ModelMeditationDataConditionInput
  ) {
    deleteMeditationData(input: $input, condition: $condition) {
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
export const createWaistData = /* GraphQL */ `
  mutation CreateWaistData(
    $input: CreateWaistDataInput!
    $condition: ModelWaistDataConditionInput
  ) {
    createWaistData(input: $input, condition: $condition) {
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
export const updateWaistData = /* GraphQL */ `
  mutation UpdateWaistData(
    $input: UpdateWaistDataInput!
    $condition: ModelWaistDataConditionInput
  ) {
    updateWaistData(input: $input, condition: $condition) {
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
export const deleteWaistData = /* GraphQL */ `
  mutation DeleteWaistData(
    $input: DeleteWaistDataInput!
    $condition: ModelWaistDataConditionInput
  ) {
    deleteWaistData(input: $input, condition: $condition) {
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
export const createUserFoodLogger = /* GraphQL */ `
  mutation CreateUserFoodLogger(
    $input: CreateUserFoodLoggerInput!
    $condition: ModelUserFoodLoggerConditionInput
  ) {
    createUserFoodLogger(input: $input, condition: $condition) {
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
export const updateUserFoodLogger = /* GraphQL */ `
  mutation UpdateUserFoodLogger(
    $input: UpdateUserFoodLoggerInput!
    $condition: ModelUserFoodLoggerConditionInput
  ) {
    updateUserFoodLogger(input: $input, condition: $condition) {
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
export const deleteUserFoodLogger = /* GraphQL */ `
  mutation DeleteUserFoodLogger(
    $input: DeleteUserFoodLoggerInput!
    $condition: ModelUserFoodLoggerConditionInput
  ) {
    deleteUserFoodLogger(input: $input, condition: $condition) {
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
export const createLevel = /* GraphQL */ `
  mutation CreateLevel(
    $input: CreateLevelInput!
    $condition: ModelLevelConditionInput
  ) {
    createLevel(input: $input, condition: $condition) {
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
export const updateLevel = /* GraphQL */ `
  mutation UpdateLevel(
    $input: UpdateLevelInput!
    $condition: ModelLevelConditionInput
  ) {
    updateLevel(input: $input, condition: $condition) {
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
export const deleteLevel = /* GraphQL */ `
  mutation DeleteLevel(
    $input: DeleteLevelInput!
    $condition: ModelLevelConditionInput
  ) {
    deleteLevel(input: $input, condition: $condition) {
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
export const createLevelSystem = /* GraphQL */ `
  mutation CreateLevelSystem(
    $input: CreateLevelSystemInput!
    $condition: ModelLevelSystemConditionInput
  ) {
    createLevelSystem(input: $input, condition: $condition) {
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
export const updateLevelSystem = /* GraphQL */ `
  mutation UpdateLevelSystem(
    $input: UpdateLevelSystemInput!
    $condition: ModelLevelSystemConditionInput
  ) {
    updateLevelSystem(input: $input, condition: $condition) {
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
export const deleteLevelSystem = /* GraphQL */ `
  mutation DeleteLevelSystem(
    $input: DeleteLevelSystemInput!
    $condition: ModelLevelSystemConditionInput
  ) {
    deleteLevelSystem(input: $input, condition: $condition) {
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
export const createPoint = /* GraphQL */ `
  mutation CreatePoint(
    $input: CreatePointInput!
    $condition: ModelPointConditionInput
  ) {
    createPoint(input: $input, condition: $condition) {
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
export const updatePoint = /* GraphQL */ `
  mutation UpdatePoint(
    $input: UpdatePointInput!
    $condition: ModelPointConditionInput
  ) {
    updatePoint(input: $input, condition: $condition) {
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
export const deletePoint = /* GraphQL */ `
  mutation DeletePoint(
    $input: DeletePointInput!
    $condition: ModelPointConditionInput
  ) {
    deletePoint(input: $input, condition: $condition) {
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
export const createUserStat = /* GraphQL */ `
  mutation CreateUserStat(
    $input: CreateUserStatInput!
    $condition: ModelUserStatConditionInput
  ) {
    createUserStat(input: $input, condition: $condition) {
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
export const updateUserStat = /* GraphQL */ `
  mutation UpdateUserStat(
    $input: UpdateUserStatInput!
    $condition: ModelUserStatConditionInput
  ) {
    updateUserStat(input: $input, condition: $condition) {
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
export const deleteUserStat = /* GraphQL */ `
  mutation DeleteUserStat(
    $input: DeleteUserStatInput!
    $condition: ModelUserStatConditionInput
  ) {
    deleteUserStat(input: $input, condition: $condition) {
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
export const createChallengeSystem = /* GraphQL */ `
  mutation CreateChallengeSystem(
    $input: CreateChallengeSystemInput!
    $condition: ModelChallengeSystemConditionInput
  ) {
    createChallengeSystem(input: $input, condition: $condition) {
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
export const updateChallengeSystem = /* GraphQL */ `
  mutation UpdateChallengeSystem(
    $input: UpdateChallengeSystemInput!
    $condition: ModelChallengeSystemConditionInput
  ) {
    updateChallengeSystem(input: $input, condition: $condition) {
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
export const deleteChallengeSystem = /* GraphQL */ `
  mutation DeleteChallengeSystem(
    $input: DeleteChallengeSystemInput!
    $condition: ModelChallengeSystemConditionInput
  ) {
    deleteChallengeSystem(input: $input, condition: $condition) {
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
export const createUserActivateType = /* GraphQL */ `
  mutation CreateUserActivateType(
    $input: CreateUserActivateTypeInput!
    $condition: ModelUserActivateTypeConditionInput
  ) {
    createUserActivateType(input: $input, condition: $condition) {
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
export const updateUserActivateType = /* GraphQL */ `
  mutation UpdateUserActivateType(
    $input: UpdateUserActivateTypeInput!
    $condition: ModelUserActivateTypeConditionInput
  ) {
    updateUserActivateType(input: $input, condition: $condition) {
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
export const deleteUserActivateType = /* GraphQL */ `
  mutation DeleteUserActivateType(
    $input: DeleteUserActivateTypeInput!
    $condition: ModelUserActivateTypeConditionInput
  ) {
    deleteUserActivateType(input: $input, condition: $condition) {
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
export const createDietData = /* GraphQL */ `
  mutation CreateDietData(
    $input: CreateDietDataInput!
    $condition: ModelDietDataConditionInput
  ) {
    createDietData(input: $input, condition: $condition) {
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
export const updateDietData = /* GraphQL */ `
  mutation UpdateDietData(
    $input: UpdateDietDataInput!
    $condition: ModelDietDataConditionInput
  ) {
    updateDietData(input: $input, condition: $condition) {
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
export const deleteDietData = /* GraphQL */ `
  mutation DeleteDietData(
    $input: DeleteDietDataInput!
    $condition: ModelDietDataConditionInput
  ) {
    deleteDietData(input: $input, condition: $condition) {
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
export const createDietSettings = /* GraphQL */ `
  mutation CreateDietSettings(
    $input: CreateDietSettingsInput!
    $condition: ModelDietSettingsConditionInput
  ) {
    createDietSettings(input: $input, condition: $condition) {
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
export const updateDietSettings = /* GraphQL */ `
  mutation UpdateDietSettings(
    $input: UpdateDietSettingsInput!
    $condition: ModelDietSettingsConditionInput
  ) {
    updateDietSettings(input: $input, condition: $condition) {
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
export const deleteDietSettings = /* GraphQL */ `
  mutation DeleteDietSettings(
    $input: DeleteDietSettingsInput!
    $condition: ModelDietSettingsConditionInput
  ) {
    deleteDietSettings(input: $input, condition: $condition) {
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
export const createExercise = /* GraphQL */ `
  mutation CreateExercise(
    $input: CreateExerciseInput!
    $condition: ModelExerciseConditionInput
  ) {
    createExercise(input: $input, condition: $condition) {
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
export const updateExercise = /* GraphQL */ `
  mutation UpdateExercise(
    $input: UpdateExerciseInput!
    $condition: ModelExerciseConditionInput
  ) {
    updateExercise(input: $input, condition: $condition) {
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
export const deleteExercise = /* GraphQL */ `
  mutation DeleteExercise(
    $input: DeleteExerciseInput!
    $condition: ModelExerciseConditionInput
  ) {
    deleteExercise(input: $input, condition: $condition) {
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
export const createRoutine = /* GraphQL */ `
  mutation CreateRoutine(
    $input: CreateRoutineInput!
    $condition: ModelRoutineConditionInput
  ) {
    createRoutine(input: $input, condition: $condition) {
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
export const updateRoutine = /* GraphQL */ `
  mutation UpdateRoutine(
    $input: UpdateRoutineInput!
    $condition: ModelRoutineConditionInput
  ) {
    updateRoutine(input: $input, condition: $condition) {
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
export const deleteRoutine = /* GraphQL */ `
  mutation DeleteRoutine(
    $input: DeleteRoutineInput!
    $condition: ModelRoutineConditionInput
  ) {
    deleteRoutine(input: $input, condition: $condition) {
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
export const createExerciseRoutine = /* GraphQL */ `
  mutation CreateExerciseRoutine(
    $input: CreateExerciseRoutineInput!
    $condition: ModelExerciseRoutineConditionInput
  ) {
    createExerciseRoutine(input: $input, condition: $condition) {
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
export const updateExerciseRoutine = /* GraphQL */ `
  mutation UpdateExerciseRoutine(
    $input: UpdateExerciseRoutineInput!
    $condition: ModelExerciseRoutineConditionInput
  ) {
    updateExerciseRoutine(input: $input, condition: $condition) {
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
export const deleteExerciseRoutine = /* GraphQL */ `
  mutation DeleteExerciseRoutine(
    $input: DeleteExerciseRoutineInput!
    $condition: ModelExerciseRoutineConditionInput
  ) {
    deleteExerciseRoutine(input: $input, condition: $condition) {
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
export const createRoutineData = /* GraphQL */ `
  mutation CreateRoutineData(
    $input: CreateRoutineDataInput!
    $condition: ModelRoutineDataConditionInput
  ) {
    createRoutineData(input: $input, condition: $condition) {
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
export const updateRoutineData = /* GraphQL */ `
  mutation UpdateRoutineData(
    $input: UpdateRoutineDataInput!
    $condition: ModelRoutineDataConditionInput
  ) {
    updateRoutineData(input: $input, condition: $condition) {
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
export const deleteRoutineData = /* GraphQL */ `
  mutation DeleteRoutineData(
    $input: DeleteRoutineDataInput!
    $condition: ModelRoutineDataConditionInput
  ) {
    deleteRoutineData(input: $input, condition: $condition) {
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
export const createFavoriteRoutine = /* GraphQL */ `
  mutation CreateFavoriteRoutine(
    $input: CreateFavoriteRoutineInput!
    $condition: ModelFavoriteRoutineConditionInput
  ) {
    createFavoriteRoutine(input: $input, condition: $condition) {
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
export const updateFavoriteRoutine = /* GraphQL */ `
  mutation UpdateFavoriteRoutine(
    $input: UpdateFavoriteRoutineInput!
    $condition: ModelFavoriteRoutineConditionInput
  ) {
    updateFavoriteRoutine(input: $input, condition: $condition) {
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
export const deleteFavoriteRoutine = /* GraphQL */ `
  mutation DeleteFavoriteRoutine(
    $input: DeleteFavoriteRoutineInput!
    $condition: ModelFavoriteRoutineConditionInput
  ) {
    deleteFavoriteRoutine(input: $input, condition: $condition) {
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
export const createUserExerciseStat = /* GraphQL */ `
  mutation CreateUserExerciseStat(
    $input: CreateUserExerciseStatInput!
    $condition: ModelUserExerciseStatConditionInput
  ) {
    createUserExerciseStat(input: $input, condition: $condition) {
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
export const updateUserExerciseStat = /* GraphQL */ `
  mutation UpdateUserExerciseStat(
    $input: UpdateUserExerciseStatInput!
    $condition: ModelUserExerciseStatConditionInput
  ) {
    updateUserExerciseStat(input: $input, condition: $condition) {
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
export const deleteUserExerciseStat = /* GraphQL */ `
  mutation DeleteUserExerciseStat(
    $input: DeleteUserExerciseStatInput!
    $condition: ModelUserExerciseStatConditionInput
  ) {
    deleteUserExerciseStat(input: $input, condition: $condition) {
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
export const createExertionData = /* GraphQL */ `
  mutation CreateExertionData(
    $input: CreateExertionDataInput!
    $condition: ModelExertionDataConditionInput
  ) {
    createExertionData(input: $input, condition: $condition) {
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
export const updateExertionData = /* GraphQL */ `
  mutation UpdateExertionData(
    $input: UpdateExertionDataInput!
    $condition: ModelExertionDataConditionInput
  ) {
    updateExertionData(input: $input, condition: $condition) {
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
export const deleteExertionData = /* GraphQL */ `
  mutation DeleteExertionData(
    $input: DeleteExertionDataInput!
    $condition: ModelExertionDataConditionInput
  ) {
    deleteExertionData(input: $input, condition: $condition) {
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
export const createDailyToDo = /* GraphQL */ `
  mutation CreateDailyToDo(
    $input: CreateDailyToDoInput!
    $condition: ModelDailyToDoConditionInput
  ) {
    createDailyToDo(input: $input, condition: $condition) {
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
export const updateDailyToDo = /* GraphQL */ `
  mutation UpdateDailyToDo(
    $input: UpdateDailyToDoInput!
    $condition: ModelDailyToDoConditionInput
  ) {
    updateDailyToDo(input: $input, condition: $condition) {
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
export const deleteDailyToDo = /* GraphQL */ `
  mutation DeleteDailyToDo(
    $input: DeleteDailyToDoInput!
    $condition: ModelDailyToDoConditionInput
  ) {
    deleteDailyToDo(input: $input, condition: $condition) {
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
export const createScheduleToDo = /* GraphQL */ `
  mutation CreateScheduleToDo(
    $input: CreateScheduleToDoInput!
    $condition: ModelScheduleToDoConditionInput
  ) {
    createScheduleToDo(input: $input, condition: $condition) {
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
export const updateScheduleToDo = /* GraphQL */ `
  mutation UpdateScheduleToDo(
    $input: UpdateScheduleToDoInput!
    $condition: ModelScheduleToDoConditionInput
  ) {
    updateScheduleToDo(input: $input, condition: $condition) {
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
export const deleteScheduleToDo = /* GraphQL */ `
  mutation DeleteScheduleToDo(
    $input: DeleteScheduleToDoInput!
    $condition: ModelScheduleToDoConditionInput
  ) {
    deleteScheduleToDo(input: $input, condition: $condition) {
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
export const createMasterToDo = /* GraphQL */ `
  mutation CreateMasterToDo(
    $input: CreateMasterToDoInput!
    $condition: ModelMasterToDoConditionInput
  ) {
    createMasterToDo(input: $input, condition: $condition) {
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
export const updateMasterToDo = /* GraphQL */ `
  mutation UpdateMasterToDo(
    $input: UpdateMasterToDoInput!
    $condition: ModelMasterToDoConditionInput
  ) {
    updateMasterToDo(input: $input, condition: $condition) {
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
export const deleteMasterToDo = /* GraphQL */ `
  mutation DeleteMasterToDo(
    $input: DeleteMasterToDoInput!
    $condition: ModelMasterToDoConditionInput
  ) {
    deleteMasterToDo(input: $input, condition: $condition) {
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
export const createWeeklyToDo = /* GraphQL */ `
  mutation CreateWeeklyToDo(
    $input: CreateWeeklyToDoInput!
    $condition: ModelWeeklyToDoConditionInput
  ) {
    createWeeklyToDo(input: $input, condition: $condition) {
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
export const updateWeeklyToDo = /* GraphQL */ `
  mutation UpdateWeeklyToDo(
    $input: UpdateWeeklyToDoInput!
    $condition: ModelWeeklyToDoConditionInput
  ) {
    updateWeeklyToDo(input: $input, condition: $condition) {
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
export const deleteWeeklyToDo = /* GraphQL */ `
  mutation DeleteWeeklyToDo(
    $input: DeleteWeeklyToDoInput!
    $condition: ModelWeeklyToDoConditionInput
  ) {
    deleteWeeklyToDo(input: $input, condition: $condition) {
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
export const createGroceryToDo = /* GraphQL */ `
  mutation CreateGroceryToDo(
    $input: CreateGroceryToDoInput!
    $condition: ModelGroceryToDoConditionInput
  ) {
    createGroceryToDo(input: $input, condition: $condition) {
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
export const updateGroceryToDo = /* GraphQL */ `
  mutation UpdateGroceryToDo(
    $input: UpdateGroceryToDoInput!
    $condition: ModelGroceryToDoConditionInput
  ) {
    updateGroceryToDo(input: $input, condition: $condition) {
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
export const deleteGroceryToDo = /* GraphQL */ `
  mutation DeleteGroceryToDo(
    $input: DeleteGroceryToDoInput!
    $condition: ModelGroceryToDoConditionInput
  ) {
    deleteGroceryToDo(input: $input, condition: $condition) {
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
