import { DataStore, Predicates } from '@aws-amplify/datastore'
import { dayjs } from '@app/date-utils'
import {
  MeditationData,
  EnduranceData,
  HabitTypeData,
  ExerciseType,
} from '@models'
import { GraphQLResult, API } from '@aws-amplify/api'
import CreateExercise from '@graphql/Mutations/CreateExercise'

import {
  CreateExerciseMutation,
  CreateExerciseMutationVariables,
} from '@app/API'


const userId = '6d9322f2-c9fb-4b33-862f-bb4d6d81bbbf'

const getRandomArbitrary = (min: number, max: number) => {
  return Math.random() * (max - min) + min
}

const dayOffset = 3

const escapeUnsafe = (unsafe: string) => unsafe
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;')
  .replace(/ /gi, '-')

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
// generate test data
export const generateMeditationTestData = async () => {
  try {
    let values = []

    for (let i = dayOffset; i < 365; i++) {
      const date = dayjs().subtract(i, 'd').format()
      const minutes = getRandomArbitrary(10, 30)
      values.push({
        date,
        minutes,
      })
    }

    if (values?.[0]?.date) {
      const promises = values.map(i => {
        return DataStore.save(
          new MeditationData({
            date: i.date,
            minutes: i.minutes,
            userId,
          })
        )
      })

      await Promise.all(promises)

    }
  } catch (e) {

  }
}

// remove test data
export const removeMeditationTestData = async () => {
  try {
    await DataStore.delete(MeditationData, Predicates.ALL)
  } catch (e) {

  }
}

export const generateEnduranceTestData = async (
  type: string,
  metric: 'reps' | 'minutes' | 'distance',
  min: number,
  max: number,
  userId: string,
) => {
  if (!type || !metric || min < 0 || max < 0) {

    return
  }

  try {
    switch (metric) {
      case 'reps':
        let values = []

        for (let i = dayOffset; i < 365; i++) {
          const date = dayjs().subtract(i, 'd').format()
          const reps = getRandomArbitrary(min, max)
          values.push({
            date,
            reps,
          })
        }

        if (values?.[0]?.date) {
          const promises = values.map(i => {
            return DataStore.save(
              new EnduranceData({
                date: i.date,
                reps: i.reps,
                userId,
                type,
                userIdType: `${userId}#${type}`
              })
            )
          })

          await Promise.all(promises)
          return
        }

      case 'minutes':
        let values1 = []

        for (let i = dayOffset; i < 365; i++) {
          const date = dayjs().subtract(i, 'd').format()
          const minutes = getRandomArbitrary(min, max)
          values1.push({
            date,
            minutes,
          })
        }

        if (values1?.[0]?.date) {
          const promises = values1.map(i => {
            return DataStore.save(
              new EnduranceData({
                date: i.date,
                minutes: i.minutes,
                userId,
                type,
                userIdType: `${userId}#${type}`
              })
            )
          })

          const results = await Promise.all(promises)
          return
        }

      case 'distance':
        let values2 = []

        for (let i = dayOffset; i < 365; i++) {
          const date = dayjs().subtract(i, 'd').format()
          const distance = getRandomArbitrary(min, max)
          values2.push({
            date,
            distance,
          })
        }

        if (values2?.[0]?.date) {
          const promises = values2.map(i => {
            return DataStore.save(
              new EnduranceData({
                date: i.date,
                distance: i.distance,
                userId,
                type,
                userIdType: `${userId}#${type}`
              })
            )
          })

          await Promise.all(promises)
          return
        }

      default:
        return
    }

  } catch (e) {

  }
}

export const removeEnduranceTestData = async () => {
  try {
    await DataStore.delete(EnduranceData, Predicates.ALL)
  } catch (e) {

  }
}

export const generateHabitTestData = async (
  type: string,
  metric: string,
  min: number,
  max: number,
  userId: string,
) => {
  if (!type || !metric || min < 0 || max < 0) {

    return
  }

  try {

    let values = []

    for (let i = dayOffset; i < 365; i++) {
      const date = dayjs().subtract(i, 'd').format()
      const value = getRandomArbitrary(min, max)
      values.push({
        date,
        value,
      })
    }

    if (values?.[0]?.date) {
      const promises = values.map(i => {
        return DataStore.save(
          new HabitTypeData({
            date: i.date,
            value: i.value,
            userId,
            type,
            unit: metric,
            userIdType: `${userId}#${type}`
          })
        )
      })

      await Promise.all(promises)
      return
    }

  } catch (e) {

  }
}

export const removeHabitTestData = async (type: string) => {
  try {

    await DataStore.delete(HabitTypeData, c => c.type('eq', type))
  } catch (e) {

  }
}

/**
enum ExerciseType
{
  REPS
  MINUTES
  DISTANCE
  POUNDS
  KILOS
} */
const EXERCISES = [
  {
    name: 'Dip',
    type: ExerciseType.POUNDS,
    description: 'To perform a dip, the exerciser supports themselves on a dip bar or from a set of rings with their arms straight down and shoulders over their hands, then lowers their body until their arms are bent to a 90 degree angle at the elbows, and then lifts their body up, returning to the starting position.',
    nId: 'null',
  },
  {
    name: 'Cable Rope Trices Pushdown',
    type: ExerciseType.POUNDS,
    description: `Start by bracing your abdominals.
    Tuck your elbows in at your sides and position your feet slightly apart.
    Inhale. Push down until your elbows are fully extended but not yet in the straight, locked position. Keep your elbows close to your body and bend your knees slightly on the pushdown. Resist bending forward. Try to keep your back as straight as possible as you push down.1﻿
    As you exhale, return to the starting point using a controlled movement. Try not to crash the weights.
    For beginners, aim to complete 4 sets of 8 reps.`,
    nId: 'null',
  },
  {
    name: 'Barbell Lying Triceps Extension',
    type: ExerciseType.POUNDS,
    description: `Grasp a loaded barbell using a shoulder-width, pronated (overhand) grip.
      Lie supine (on your back) on a flat bench.
      Press the barbell upward until your arms are fully extended and hold it over your forehead.
      Inhale as you flex your elbows and shoulders to lower the barbell behind your head.
      Exhale as you extend your elbows and shoulders to raise the barbell back to the starting position.
    `,
    nId: 'null',
  },
  {
    name: 'Barbell Bench Press',
    type: ExerciseType.POUNDS,
    description: `Lie flat on your back on a bench.
      Grip the bar with hands just wider than shoulder-width apart, so when you’re at the bottom of your move your hands are directly above your elbows. This allows for maximum force generation.
      Bring the bar slowly down to your chest as you breathe in.
      Push up as you breathe out, gripping the bar hard and watching a spot on the ceiling rather than the bar, so you can ensure it travels the same path every time.
      `,
    nId: 'null',
  },
  {
    name: 'Barbell Incline Bench Press',
    type: ExerciseType.POUNDS,
    description: `Set up your bench at an angle of around 30-45°.
      Lie back and place your hands on the bar, slightly wider than shoulder-width apart, with your palms facing up.
      Lift the bar out of the rack and press it up until your arms are extended and your hands are above your shoulders.
      Slowly lower the bar to your chest, then press it back up again.
    `,
    nId: 'null',
  },
  {
    name: 'Machine Fly',
    type: ExerciseType.POUNDS,
    description: `Sit up tall and relax your neck and shoulders. Your feet should be flat on the floor.
      Grab the handles so that your palms are facing forward. Note that some machines have a foot bar that you need to push in order to release the handles and bring them forward.
      Press your arms together in front of your chest with a slow, controlled movement. Keep a slight, soft bend in the elbows with wrists relaxed.
      Pause for one second once your arms are fully "closed" in front of your chest.
      Bring your arms slowly back to the starting position, opening your chest and keeping posture strong and upright.
    `,
    nId: 'null',
  },
  {
    name: 'DumbBell Lateral Raise',
    type: ExerciseType.POUNDS,
    description: `Stand or sit with a dumbbell in each hand at your sides.
      Keep your back straight, brace your core, and then slowly lift the weights out to the side until your arms are parallel with the floor, with the elbow slightly bent.
      Then lower them back down, again in measured fashion.
    `,
    nId: 'null',
  },
  {
    name: 'Dumbbell Shoulder Press',
    type: ExerciseType.POUNDS,
    description: `Hold the dumbbells by your shoulders with your palms facing forwards and your elbows out to the sides and bent at a 90° angle.
      Without leaning back, extend through your elbows to press the weights above your head.
      Then slowly return to the starting position.
    `,
    nId: 'null',
  },
  {
    name: 'Barbell Shoulder Press',
    type: ExerciseType.POUNDS,
    description: `Start by standing with your feet about shoulder-width apart. Your hips should be fully extended, as should your knees, but be careful not to lock your knees.
      Hold the barbell in a front-rack position (resting on the front of your shoulders), with your elbows pointing forward.
      Press until your arms are fully locked out.
      Press your head through the “window” made by your arms.
      Engage your back muscles and with control, lower the barbell back to the front rack position.
    `,
    nId: 'null',
  },
  {
    name: 'Barbell Curl',
    type: ExerciseType.POUNDS,
    description: `Stand tall with your chest up and core braced, holding the barbell with your hands just outside of your hips, using an underhand grip.
      Keeping your chest up and your elbows tight to your sides, initiate the move by raising your hands slightly so you feel your biceps become engaged.
      Curl the bar up to shoulder height, then give your biceps a one-second squeeze.
      Start to lower the bar slowly, keeping your biceps tensed and engaged to work as many muscle fibres as possible.
    `,
    nId: 'null',
  },
  {
    name: 'Dumbbell Alternate Hammer Curl',
    type: ExerciseType.POUNDS,
    description: `Start off standing with your feet shoulder-width apart, keeping your knees slightly bent and your abs drawn in tightly.
      Grab a dumbbell in each hand with your palms facing inward and extend your arms out at the sides of your body.
      While keeping your elbows locked in at your sides, slowly lift your left arm in an arc motion towards your left shoulder, isolating the bicep and squeeze the muscle.
      Hold for a count and return back to the starting position.
      Repeat the same steps with your right arm for as many reps and sets as desired.
    `,
    nId: 'null',
  },
  {
    name: 'Dumbbell Incline Curl',
    description: `Position an incline bench at roughly 55-65 degrees, select the desired weight from the rack, and sit upright with your back flat against the pad.
      Using a supinated (palms up) grip, take a deep breath and curl both dumbbells towards your shoulders.
      Once the biceps are fully shortened, slowly lower the weights back to the starting position.
    `,
    type: ExerciseType.POUNDS,
    nId: 'null',
  },
  {
    name: 'Air Bike',
    type: ExerciseType.REPS,
    description: `Lay supine in a relaxed position with your arms behind your head and legs straight.
      Exhale as you raise one knee towards your face while driving the opposite elbow to the knee.
      Once your abs are fully contracted, slowly lower yourself back to the starting position and repeat on the opposite side.
    `,
    nId: 'null',
  },
  {
    name: 'Leg Raise',
    type: ExerciseType.REPS,
    description: `Lie on your mat, with legs straight out in front of you. Press the low back into the ground.
      Engage your core and lift your legs until they form a 90-degree angle with your body.
      Slowly lower them back down until they're hovering over the ground (or as far as you can go without your back peeling off the mat).
    `,
    nId: 'null',
  },
  {
    name: 'Decline Crunch',
    type: ExerciseType.REPS,
    description: `Adjust the bench at the appropriate decline angle relative to your level of experience.
      Sit on the bench and place your knees over and feet under the foam rollers if using a decline bench.
      Lie back on the bench and place your hands gently behind your ears or cross them over your chest.
      Contract your core and curl your torso up as high as your abs will allow without sitting all the way up. Make sure to exhale on the way up but do not extend your stomach out as you exhale; you simply want to act as if you’re flexing your abdominals muscles in the mirror.
      Lower back down while inhaling but don’t allow your shoulders and upper back to touch the bench.
    `,
    nId: 'null',
  },
  {
    name: 'Wide Grip Lat Pulldown',
    type: ExerciseType.POUNDS,
    description: `Extend your arms upwards to grab the bar at the widest grip position with your palms facing away from you. Your hands should be wider than shoulder width apart.
      While slightly leaning back, brace your core, bring your shoulder blades down and back, and pull the bar down until it touches the top of your rib cage.
      Pause briefly at the bottom, squeeze your lats, and slowly return to the starting position.

    `,
    nId: 'null',
  },
  {
    name: 'Barbell Deadlift',
    type: ExerciseType.POUNDS,
    description: `With feet flat beneath bar, squat down and grasp bar with shoulder width or slightly wider overhand or mixed grip.
      Lift bar by extending hips and knees to full extension.
      Pull shoulders back at top of lift if rounded. Return and repeat.
    `,
    nId: 'null',
  },
  {
    name: 'Barbell Bent Over Row',
    type: ExerciseType.POUNDS,
    description: `Stand with your feet shoulder-width apart.
      Bend your knees and lean forward from the waist.
      Your knees should be bent, but your back stays straight, with your neck in line with your spine.
      Grab the bar with your hands (palms-down), just wider than shoulder-width apart and let it hang with your arms straight.
      Brace your core and squeeze your shoulders together to row the weight up until it touches your sternum, then slowly lower it back down again.
    `,
    nId: 'null',
  },
  {
    name: 'Barbell Behind The Back Wrist Curl',
    type: ExerciseType.POUNDS,
    description: `Set up a barbell on a rack about knee level and stand facing away from it.
      Then, bend down and grab the barbell with a shoulder-width grip and stand up straight.
      Now, control the barbell and let it roll down your fingertips.
      Then, curl the barbell back up while flexing your forearms.
    `,
    nId: 'null',
  },
  {
    name: 'Dumbbell Palms Up Wrist Curl Over A Bench',
    type: ExerciseType.POUNDS,
    description: `Start by picking up a dumbbell in each hand while kneeling over a bench.
    With your palms facing upwards flex each forearm by lifting and lowering the dumbbell with only your wrist.
    Exhale while raising your wrist.
    Inhale while lowering your wrist.
    Repeat for the desired amount of reps and sets.
    `,
    nId: 'null',
  },
  {
    name: 'Dumbbell Palms Down Wrist Curl Over A Bench',
    type: ExerciseType.POUNDS,
    description: `
      Start by picking up a dumbbell in each hand while kneeling over a bench.
      With your palms facing downwards flex each forearm by lifting and lowering each dumbbell with only your wrist.
      Exhale while raising your wrist and hold for a count, feeling a stretch in your forearms.
      Inhale while lowering your wrist.
    `,
    nId: 'null',
  },
  {
    name: 'Barbell Squat',
    type: ExerciseType.POUNDS,
    description: `Take the bar out of the rack with it resting on your rear shoulder muscles.
      Take two big steps back and stand with your feet roughly shoulder-width apart, toes pointing slightly out.
      Keep your spine in alignment by looking at a spot on the floor about two metres in front of you, then “sit” back and down as if you’re aiming for a chair.
      Descend until your hip crease is below your knee.
      Keep your weight on your heels as you drive back up.
    `,
    nId: 'null',
  },
  {
    name: 'Lying Leg Curls',
    type: ExerciseType.POUNDS,
    description: `Exhale and flex your knees, pulling your ankles as close to your buttocks as you can.
      Hold briefly.
      Inhale as you return your feet to the starting position in a slow and controlled movement.
      `,
    nId: 'null',
  },
  {
    name: 'Barbell Lunge',
    type: ExerciseType.POUNDS,
    description: `Stand tall and hold a barbell across your upper back.
      Take a large step forward with one leg, lowering your rear knee towards the floor while keeping your front shin as vertical as possible.
      Push yourself back to the starting position.
    `,
    nId: 'null',
  },
  {
    name: 'Bridge',
    type: ExerciseType.REPS,
    description: `Lie face up on the floor, with your knees bent and feet flat on the ground.
      Keep your arms at your side with your palms down.
      Lift your hips off the ground until your knees, hips and shoulders form a straight line.
      Squeeze those glutes hard and keep your abs drawn in so you don’t overextend your back during the exercise.
      Hold your bridged position for a couple of seconds before easing back down.
    `,
    nId: 'null',
  },
  {
    name: 'Glute Kickback',
    type: ExerciseType.REPS,
    description: `Place yourself on all fours, with your knees bent and your hands directly beneath your shoulders (the kneeling push-up position).
      Keep your back straight and your core tight.
      Lift up your right leg and kick it back, behind you (try to do this slowly and deliberately).
      Keep extending your leg, and contract your glutes until your hamstring is in line with your back.
      Your knee should stay bent at a right angle throughout the exercise.
      Return your right leg to the floor.
    `,
    nId: 'null',
  },
  {
    name: 'Smith Machine Lunge',
    type: ExerciseType.POUNDS,
    description: `Set up in a smith machine with the bar on your traps in a split stance position.
      Descend by flexing both knees simultaneously and continue until the back knee touches the ground directly beneath the hip.
      Drive through the front foot and extend the knee as you return to the starting position.
    `,
    nId: 'null',
  },
  {
    name: 'Treadmill Running',
    type: ExerciseType.DISTANCE,
    description: '',
    nId: 'null',
  },
  {
    name: 'Elliptical Training',
    type: ExerciseType.DISTANCE,
    description: '',
    nId: 'null',
  },
  {
    name: 'Walking',
    type: ExerciseType.DISTANCE,
    description: '',
    nId: 'null',
  },
  {
    name: 'Seated Calf Raise',
    type: ExerciseType.POUNDS,
    description: `Sit tall on a bench or chair with your feet flat on the ground, holding two heavy dumbbells on top of your knees.
    Keeping your core engaged, lift your heels off the ground as high as possible.
    Slowly lower your heels back down to the ground and repeat.
    `,
    nId: 'null',
  },
  {
    name: 'Calf Press On Leg Press',
    type: ExerciseType.POUNDS,
    description: `Sit down on a Leg Press Machine and press the plate up as if you were performing a leg press.
    Slide your feet down so that the balls of your feet are pressing against the rack and your heels hanging free.
    Keeping the handles locked, press up and flex your toes and then slowly bring your toes back towards your body.

    `,
    nId: 'null',
  },
  {
    name: 'Standing Calf Raises',
    type: ExerciseType.POUNDS,
    description: `Stand up straight, then push through the balls of your feet and raise your heel until you are standing on your toes.
      Then lower slowly back to the start.
    `,
    nId: 'null',
  }
]

export const generateExercises = async () => {
  try {

    const promises = EXERCISES.map(i => {
      return API
        .graphql({
          query: CreateExercise,
          variables: {
            input: i
          } as CreateExerciseMutationVariables
        }) as GraphQLResult<CreateExerciseMutation>
    })

    const results = await Promise.all(promises)



    /**

    const exerciseData = await API
      .graphql({
        query: CreateExercise,
        variables: {
          input: {
            name: escapeUnsafe(capitalizeFirstLetter(name)),
            type,
            description,
            nId: 'null',
          }
        } as CreateExerciseMutationVariables,
      }) as GraphQLResult<CreateExerciseMutation>
     */

  } catch (e) {

  }
}
