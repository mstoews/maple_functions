'use strict';

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
type Firestore = admin.firestore.Firestore
//const app = admin.initializeApp();
admin.initializeApp(functions.config().firebase);

import {COMMENT_EVENT, LIKE_EVENT, BOOKMARK_EVENT} from "./constants";
import * as notificationFunctions from './notifications'
import * as atomicFunctions from './atomic-operations/index'

export const firestoreInstance = admin.firestore();

export const newFollowerNotification = functions.firestore
    .document('publicUserData/{followerId}/Followers/{followedId}')
    .onCreate(event => {
        return notificationFunctions.sendNewFollowerNotification(event);
    });

export const newLikeNotification = functions.firestore
    .document('Posts/{postId}/Likes/{likeId}')
    .onCreate(event => {
        return notificationFunctions.sendPostNotication(event, LIKE_EVENT)
    });

export const newBookmarkNotification = functions.firestore
    .document('Posts/{postId}/Bookmark/{bookmarkId}')
    .onCreate(event => {
        return notificationFunctions.sendPostNotication(event, BOOKMARK_EVENT)
    });

export const newCommentNotification = functions.firestore
    .document('posts/{postId}/comments/{commentId}')
    .onCreate(event => {
        return notificationFunctions.sendPostNotication(event, COMMENT_EVENT)
    });

export const updateFeedAfterFollow = functions.firestore
    .document('PublicUserData/{followerId}/Following/{followedId}')
    .onCreate(event => {
        return atomicFunctions.updateFeedAfterUserAction(event, true);
    });

export const updateFeedAfterUserNewWorkout = functions.firestore
    .document('Posts/{postId}')
    .onCreate(event => {
        return atomicFunctions.updateFollowersFeed(event, false)
    });

export const updateFeedAfterUnFollow = functions.firestore
    .document('PublicUserData/{followerId}/Following/{followedId}')
    .onDelete(event => {
        return atomicFunctions.updateFeedAfterUserAction(event, false);
    });



export const computeAverageReview = functions.firestore
  .document('posts/{postId}/comments/{commentsId}').onCreate((snap, context) => {
    // get the data from the write event
    const eventData = snap.data();
    // get the previous value, if it exists
    // const prev = change.before;
    // const rating = eventData.rating;
    // let previousValue
    // if (prev.exists) {
    //     previousValue = prev.data();
    //     const prevRating = previousValue.rating;
    //     if (rating === prevRating) {
    //         console.log("not a new rating.");
    //         return null;
    //     }
    // }
    // get the restaurant 

    const postId = context.params.postId;
    const commentsId = context.params.commentsId;
    console.log(" Log is printing " + postId + "  Comments :" + commentsId) ;
    const value = snap.data();
    const text  = value.text;
    console.log("Comments: " + text);

    // get a reference to the root of the firestore DB
    //const db = app.firestore()
    // if a previous value exists, then it needs to be replaced
    // when computing an average. Otherwise, add the new rating
      return null
  });

async function updateAverage(db: Firestore, restaurantID: string, newRating: number, prev: boolean) {
    const updateDB = db.collection('restaurants').doc(restaurantID);
    const restaurantDoc = await updateDB.get();
    if (!restaurantDoc.exists) {
        console.log("Document does not exist!");
        return null;
    }
    const oldRating = restaurantDoc.data().averageRating;
    const oldNumReviews = restaurantDoc.data().reviewCount;
    let newNumReviews = oldNumReviews+1;
    let newAvgRating = ((oldRating*oldNumReviews)+newRating)/newNumReviews;
    // no need to increase review numbers if not a new review
    // subtract the different made by the review
    if (prev) {
      newNumReviews = oldNumReviews;
      newAvgRating = ((oldRating*oldNumReviews)-newRating)/oldNumReviews;
    }
    await updateDB.update({averageRating: newAvgRating, reviewCount: newNumReviews});
    console.log("average updated");
    return null;
  }    

exports.makeUppercase = functions.firestore.document('/posts/{documentId}')
    .onCreate((snap, context) => {
// [END makeUppercaseTrigger]
      // [START makeUppercaseBody]
      // Grab the current value of what was written to the Realtime Database.
      const original = snap.data().original;
      console.log('Uppercasing', context.params.documentId, original);
      const uppercase = original.toUpperCase();
      // You must return a Promise when performing asynchronous tasks inside a Functions such as
      // writing to the Firebase Realtime Database.
      // Setting an 'uppercase' sibling in the Realtime Database returns a Promise.
      return snap.ref.set({uppercase}, {merge: true});
      // [END makeUppercaseBody]
    });

