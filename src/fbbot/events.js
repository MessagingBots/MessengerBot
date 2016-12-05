import axios from 'axios';
import config from 'config-heroku';
import sendUtils from './sendUtils';

const ONE_COURSE_API = config.ONE_COURSE_API;
const CANVAS_URL = config.CANVAS_URL;
const moment = require('moment');

// Get an array of all the grades given a courseID.
// Return that array of grades, Where each grade is simplified with lesss fields.
function getCourseGrades(userId, controller, courseID) {
  return new Promise((resolve, reject) => {
    controller.storage.students.getByFBSenderID(userId, (err, user) => {
      if (err) {
        console.log('Error finding user');
        console.log(err);
        reject('I\'m sorry there was an error.');
      } else if (!user) {
        console.log('We couldn\'t find a user for this account, please link your account');
        reject('We couldn\'t find a user for this account, please link your account');
      } else if (user.canvas.token) {
        // Get the user's grade  for this course on Canvas
        sendUtils.getCourseGrades(user.canvas.token, courseID)
        .then((grades) => {
          const simplifiedGrades = [];
          grades[0].submissions.forEach((submission) => {
            // Only if there is a grade score.
            if (submission.score) {
              const simplifiedGrade = {
                id: submission.id,
                score: submission.score,
                graded_at: submission.graded_at,
                submitted_at: submission.submitted_at,
                assignment_id: submission.assignment.id,
                assignment_name: submission.assignment.name,
                assignment_created_at: submission.assignment.created_at,
                assignment_due_at: submission.assignment.due_at,
                assignment_points_possible: submission.assignment.points_possible,
                assignment_html_url: submission.assignment.html_url,
              };
              simplifiedGrades.push(simplifiedGrade);
            }
            // console.log(simplifiedGrade);
          });

          // Sort them by the graded date.
          simplifiedGrades.sort(function (a, b) {
            return a.graded_at < b.graded_at;
          });
          // console.log(simplifiedGrades);

          // Send it all back. All the grades with minimalistic fields.
          const courseGrade = {
            user_id: grades[0].user_id,
            section_id: grades[0].section_id,
            computed_final_score: grades[0].computed_final_score,
            computed_current_score: grades[0].computed_current_score,
            grades: simplifiedGrades,
          };
          resolve(courseGrade);
        })
        .catch((error) => {
          console.log('Error getting grades');
          console.log(error);
          reject(error);
        });
      } else {
        console.log('We couldn\'t find a token for this account, please link your account');
        reject('We couldn\'t find a token for this account, please link your account');
      }
    });
  });
}

// Get an array of all the assignments given a courseID.
// Return that array of assigments, Where each assigment is simplified with lesss fields.
function getCourseAssignments(userId, controller, courseID) {
  return new Promise((resolve, reject) => {
    controller.storage.students.getByFBSenderID(userId, (err, user) => {
      if (err) {
        console.log('Error finding user');
        console.log(err);
        reject('I\'m sorry there was an error.');
      } else if (!user) {
        console.log('We couldn\'t find a user for this account, please link your account');
        reject('We couldn\'t find a user for this account, please link your account');
      } else if (user.canvas.token) {
        // Get the user's assignments  for this course on Canvas
        sendUtils.getCourseAssignments(user.canvas.token, courseID)
        .then((assignments) => {
          // console.log(assignments);
          const simplifiedAssigments = [];
          assignments.forEach((assignment) => {
            const simplifiedAssigment = {
              id: assignment.id,
              name: assignment.name,
              created_at: assignment.created_at,
              due_at: assignment.due_at,
              points_possible: assignment.points_possible,
              html_url: assignment.html_url,
            };
            simplifiedAssigments.push(simplifiedAssigment);
            // console.log(simplifiedAssigment);
          });

          // Sort them by the due date.
          simplifiedAssigments.sort(function (a, b) {
            return a.due_at > b.due_at;
          });
          // console.log(simplifiedAssigments);

          // Send it all back. All the assiments with minimalistic fields.
          resolve(simplifiedAssigments);
        })
        .catch((error) => {
          console.log('Error getting assignments');
          console.log(error);
          reject(error);
        });
      } else {
        console.log('We couldn\'t find a token for this account, please link your account');
        reject('We couldn\'t find a token for this account, please link your account');
      }
    });
  });
}

// Get an array of all the announcements given a courseID
// REturn the array of the announcements where each announcment now has simplified fileds.
function getCourseAnnouncements(userId, controller, courseID) {
  return new Promise((resolve, reject) => {
    controller.storage.students.getByFBSenderID(userId, (err, user) => {
      if (err) {
        console.log('Error finding user');
        console.log(err);
        reject('I\'m sorry there was an error.');
      } else if (!user) {
        console.log('We couldn\'t find a user for this account, please link your account');
        reject('We couldn\'t find a user for this account, please link your account');
      } else if (user.canvas.token) {
        // Get the user's announcments  for this course on Canvas
        sendUtils.getCourseAnnouncements(user.canvas.token, courseID)
        .then((announcments) => {
          // console.log(announcments);
          const simplifiedAnnouncments = [];

          announcments.forEach((announcment) => {
            const simplifiedAnnouncment = {
              id: announcment.id,
              title: announcment.title,
              posted_at: announcment.posted_at,
              context_code: announcment.context_code,
              html_url: announcment.html_url,
              message: announcment.message,
            };
            simplifiedAnnouncments.push(simplifiedAnnouncment);
            // console.log(simplifiedAnnouncment);
          });

          // Sort them by the posted date.
          simplifiedAnnouncments.sort(function (a, b) {
            return a.posted_at < b.posted_at;
          });
          // console.log(simplifiedAnnouncments);

          // Send it all back. All the assiments with minimalistic fields.
          resolve(simplifiedAnnouncments);
        })
        .catch((error) => {
          console.log('Error getting announcments');
          console.log(error);
          reject(error);
        });
      } else {
        console.log('We couldn\'t find a token for this account, please link your account');
        reject('We couldn\'t find a token for this account, please link your account');
      }
    });
  });
}

// Get an array of all the courses currently enrolled
// Return the array of courses enroled, where each course is simplified.
function getCoursesEnrolled(userId, controller) {
  return new Promise((resolve, reject) => {
    controller.storage.students.getByFBSenderID(userId, (err, user) => {
      if (err) {
        console.log('Error finding user');
        console.log(err);
        reject('I\'m sorry there was an error.');
      } else if (!user) {
        console.log('We couldn\'t find a user for this account, please link your account');
        reject('We couldn\'t find a user for this account, please link your account');
      } else if (user.canvas.token) {
        // Get the user's currently enrolled courses on Canvas
        sendUtils.getUserCanvasCourses(user.canvas.token)
        .then((courses) => {
          const simplifiedCourses = [];
          courses.forEach((tempCourse) => {
            if (!tempCourse.name) {
              tempCourse.name = 'No name for course';
            }
            const simplifiedCourse = {
              course_id: tempCourse.id,
              course_name: tempCourse.name,
              course_code: tempCourse.course_code,
            };
            simplifiedCourses.push(simplifiedCourse);
            // console.log(simplifiedCourse);
          });

          // Send it all back. All the grades with minimalistic fields.
          resolve(simplifiedCourses);
        })
        .catch((error) => {
          console.log('Error getting courses');
          console.log(error);
          reject(error);
        });
      } else {
        console.log('We couldn\'t find a token for this account, please link your account');
        reject('We couldn\'t find a token for this account, please link your account');
      }
    });
  });
}

function getSchedule(userId, controller) {
  return new Promise((resolve, reject) => {
    controller.storage.students.getByFBSenderID(userId, (err, user) => {
      if (err) {
        console.log('Error finding user');
        console.log(err);
        reject('I\'m sorry there was an error.');
      } else if (!user) {
        console.log('We couldn\'t find a user for this account, please link your account');
        reject('We couldn\'t find a user for this account, please link your account');
      } else if (user.canvas.token) {
        // Get the user's courses on Canvas
        sendUtils.getUserCanvasCourses(user.canvas.token)
        .then((courses) => {
          // Build promises to query One UF course for class meeting times
          const promises = courses.map((course) => {
            if (!course.name) {
              course.name = 'No name for course';
            }

            // Keep the sections we get from canvas
            const canvasSections = course.sections;
            // Use regex to match a course code, i.e. CEN3939
            const courseRe = /([a-z]{3}[0-9]{4}[a-z]?)/i;
            const courseCode = course.course_code;
            const cleanCourseCode = courseCode.match(courseRe)[1];

            // Build our request options for One UF
            const opts = {
              url: `${ONE_COURSE_API}${cleanCourseCode}`,
              // attach the canvas sections for use later
              transformResponse: [function (data) {
                const JSONdata = JSON.parse(data);
                JSONdata.canvasSections = canvasSections;
                return JSONdata;
              }],
            };

            return axios.request(opts);
          }); // end of const promises = courses.map(...)

          axios.all(promises)
          .then((res) => {
            // returnMessage is the final string of Course codes and times
            let returnMessage = '';
            const resDatas = res.map(r => r.data);

            // For each One UF course...
            resDatas.forEach((course) => {
              // Extract the relevant data from the JSON
              const matchedCourse = JSON.parse(course[0].COURSES)[0];
              // LOG HERE
              const courseCode = matchedCourse.code;
              // Get the sections from One UF
              const sections = matchedCourse.sections;
              // Get the canvas sections we attached earlier
              const canvasSections = course.canvasSections;
              let courseSectionTimes = '';
              returnMessage += `${courseCode}\n`;

              sections.forEach((section) => {
                // find user's Canvas section that matches a One UF section
                canvasSections.some((canvasSection) => {
                  let canvasSectionName = canvasSection.name;
                  const sectionRe = /[a-z0-9]*-?([0-9]{4})/i;
                  const cleanedSectionName = canvasSectionName.match(sectionRe);

                  if (cleanedSectionName && cleanedSectionName.length > 0) {
                    canvasSectionName = cleanedSectionName[1];
                  }
                  if (canvasSectionName === section.number) {
                    section.meetTimes.forEach((meet) => {
                      // Build string of meeting times for the section
                      courseSectionTimes += `${meet.meetDays}: ${meet.meetTimeBegin} - ${meet.meetTimeEnd} at ${meet.meetBuilding}${meet.meetRoom}\n`;
                    });
                    return true;
                  }
                });
              });

              if (courseSectionTimes === '') {
                courseSectionTimes = 'No times found';
              }

              // Attach the section times to the return message
              returnMessage += `${courseSectionTimes}\n`;
            });

            // Finally, send it all back!
            resolve(returnMessage);
          })
          .catch((e) => {
            console.log('There was an error loading One UF courses');
            console.log(e);
            reject(e);
          });
        })
        .catch((error) => {
          console.log('Error getting courses');
          console.log(error);
          reject(error);
        });
      } else {
        console.log('We couldn\'t find a token for this account, please link your account');
        reject('We couldn\'t find a token for this account, please link your account');
      }
    });
  });
}

function alterUserCourseSubscriptions(userId, course, controller, subscribe) {
  // first check session
  controller.storage.students.getByFBSenderID(userId, (err, foundUser) => {
    if (err) {
      console.log('Error finding user');
      console.log(err);
    } else if (!foundUser) {
      console.log('No user found...');
    } else {
      let subscribedCourses = foundUser.canvas.subscribedCourses;
      if (!subscribedCourses) {
        subscribedCourses = [];
      }

      // Is the user subscribing or removing a course?
      if (subscribe) {
        if (subscribedCourses.some(subscribedCourse => subscribedCourse.id === course.id)) {
          return;
        }
        subscribedCourses.push(course);
      } else {
        const indexOfCourse = sendUtils.arrayObjectIndexOf(subscribedCourses, course.id, 'id');
        if (indexOfCourse > -1) {
          subscribedCourses.splice(indexOfCourse, 1);
        }
      }

      controller.storage.students.findOneByFBSenderIDAndUpdate(userId,
        { $set: { 'canvas.subscribedCourses': subscribedCourses } },
        (innerErr, innerUser) => {
          if (innerErr) {
            console.log('Error adding subscribed courses');
            console.log(innerErr);
          } else if (!innerUser) {
            console.log('No user found...');
          } else {
            console.log('User with courses is');
            console.log(innerUser);
          }
        });
    }
  });
}

/*
* Display all the grades given a course ID.
* First query the grades and then display as a list of generics
*/
function displayCourseGrades(convo, message, controller, data) {
  getCourseGrades(message.user, controller, data.course_id)
  .then((gradesMsg) => {
    if (gradesMsg.grades.length > 0) {
      convo.say(`Here are the grades from ${data.course_name}`);
      gradesMsg.grades.forEach((gradeMsg) => {
        const gradedDate = moment(gradeMsg.graded_at);
        const attachment = {
          type: 'template',
          payload: {
            template_type: 'generic',
            elements: [
              {
                title: gradeMsg.assignment_name,
                subtitle: 'Graded at: ' + gradedDate.format('MMMM Do YYYY, h:mm:ss a') + ', Score: ' + gradeMsg.score + '/' + gradeMsg.assignment_points_possible,
                // item_url: gradeMsg.html_url,
                default_action: {
                  type: 'web_url',
                  url: gradeMsg.assignment_html_url,
                },
                // buttons: [
                //   {
                //     title: 'View in Canvas',
                //     type: 'web_url',
                //     url: gradeMsg.assignment_html_url,
                //   },
                // ],
              },
            ],
          },
        };
        convo.say({ attachment });
      });
      // Total grade as now.
      convo.say(`Total grade: ${gradesMsg.computed_current_score} %`);
    } else {
      convo.say('There are no grades at this time. Check back later.');
    }
  })
  .catch((e) => {
    console.log('Error');
    console.log(e);
    convo.say(e);
  });
}

/*
* Display all the upcoming assignments given a course ID.
* First query the upcoming assignments and then display as a list of generics
*/
function displayCourseUpcomingHw(convo, message, controller, data) {
  return new Promise(function(resolve, reject) {
    getCourseAssignments(message.user, controller, data.course_id)
    .then((assignmentsMsg) => {
      const returnAttachments = [];
      returnAttachments.push(`Here are your assignments for ${data.course_name}`);
      if (assignmentsMsg.length > 0) {
        assignmentsMsg.forEach((tempAssigmentMsg) => {
          const dueDateFormatted = moment(tempAssigmentMsg.due_at);
          const dateNow = moment();

          if (dueDateFormatted.isAfter(dateNow)) {
            const attachment = {
              type: 'template',
              payload: {
                template_type: 'generic',
                elements: [
                  {
                    title: tempAssigmentMsg.name,
                    subtitle: 'Due Date: ' + dueDateFormatted.format('MMMM Do YYYY, h:mm:ss a') + ', Points: ' + tempAssigmentMsg.points_possible,
                    buttons: [
                      {
                        title: 'View in Canvas',
                        type: 'web_url',
                        url: tempAssigmentMsg.html_url,
                      },
                    ],
                  },
                ],
              },
            };
            returnAttachments.push({ attachment });
          }
        });
      } else {
        returnAttachments.push('There are no assignments posted at this time. Check back later.');
      }
      resolve(returnAttachments);
    })
    .catch((e) => {
      console.log('Error');
      console.log(e);
      reject(e);
    });
  });
}

/*
* Display all the announcments given a course ID.
* First query the announcments and then display as a list of generics
*/
function displayCourseAnnouncements(convo, message, controller, data) {
  return new Promise(function(resolve, reject) {
    getCourseAnnouncements(message.user, controller, data.course_id)
    .then((announcementsMsg) => {
      const returnAttachments = [];
      returnAttachments.push(`Here are your announcements for ${data.course_name}`);
      if (announcementsMsg.length > 0) {
        for (let i = 0; i < (announcementsMsg.length && 3); i += 1) {
          const postedDate = moment(announcementsMsg[i].posted_at).format('MMMM Do YYYY, h:mm:ss a');

          const attachment = {
            type: 'template',
            payload: {
              template_type: 'generic',
              elements: [
                {
                  title: announcementsMsg[i].title,
                  subtitle: 'Posted at: ' + postedDate,
                  // default_action: {
                  //   type: 'web_url',
                  //   url: announcementsMsg[i].html_url,
                  // },
                  buttons: [
                    {
                      title: 'Read More',
                      type: 'web_url',
                      url: announcementsMsg[i].html_url,
                    },
                  ],
                },
              ],
            },
          };
          returnAttachments.push({ attachment });
        }

        if (announcementsMsg.length > 3) {
          // If more than 3 announcements, send a button for mor.
          const attachment = {
            type: 'template',
            payload: {
              template_type: 'button',
              text: 'What to read older announcements?',
              buttons: [
                {
                  title: 'More Announcements',
                  type: 'web_url',
                  url: CANVAS_URL + 'courses/' + data.course_id + '/announcements',
                },
              ],
            },
          };
          returnAttachments.push({ attachment });
        }
      } else {
        returnAttachments.push('There are no announcements posted at this time. Check back later.');
      }
      resolve(returnAttachments);
    })
    .catch((e) => {
      console.log('Error');
      console.log(e);
      reject(e);
    });
  });
}

function getQuickReplyExamples() {
  return {
    text: 'Example commands',
    quick_replies: [
      {
        content_type: 'text',
        title: 'Announcements',
        payload: JSON.stringify({
          action: 'getAnnouncements',
        }),
      },
      {
        content_type: 'text',
        title: 'Upcoming HW',
        payload: JSON.stringify({
          action: 'getUpcomingHw',
        }),
      },
    ],
  };
}

/**
 * sendHelpCommandMessage - Generate the list of help commands and send them to the user
 *
 * @param  {type} bot     description
 * @param  {type} message description
 * @return {type}         description
 */
function sendHelpCommandMessage(bot, message) {
  const commands = [
    {
      name: 'help',
      value: 'Learn about what I can do',
    },
    {
      name: 'courses',
      value: 'Display your active courses on Canvas',
    },
    {
      name: 'linking',
      value: 'Link your Facebook profile to make use of the bot',
    },
    {
      name: 'Even More!',
      value: 'You can open the persistent menu next to your typing input to ' +
       'do things like view your schedule, view upcoming assignments, ' +
       'announcements, and more!',
    },
  ];

  let helpMsg = '';
  bot.startConversation(message, (err, convo) => {
    convo.say('Here are some of the things you can ask me to do.');
    commands.forEach((command) => {
      helpMsg = `${command.name}: ${command.value}`;
      convo.say(helpMsg);
    });
    convo.say(getQuickReplyExamples());
  });
}

// Take in the Botkit controller and attach events to it
exports.eventHandler = (controller) => {
  // This is triggered when a user clicks the send-to-messenger plugin
  controller.on('facebook_optin', (bot, message) => {
    bot.reply(message, 'Welcome, friend');
  });

  // This is triggered when a user clicks the send-to-messenger plugin
  controller.on('message_delivered', (bot, message) => {
    console.log(message);
    console.log('message delivered');
  });

  // This is triggered when a user clicks a postback
  // payload comes in the JSON form: { action: String, data: Object }
  controller.on('facebook_postback', (bot, message) => {
    console.log('postback');
    try {
      const payload = JSON.parse(message.payload);
      const { action, data } = payload;

      console.log('POSTBACK!!');
      console.log(payload);
      switch (action) {
        case 'watchCourse':
          alterUserCourseSubscriptions(message.user, data.course, controller, true);
          break;

        case 'removeCourse':
          alterUserCourseSubscriptions(message.user, data.course, controller, false);
          break;

        case 'getSchedule':
          // Get the user's schedule using Canvas and One UF search
          console.log('Student Schedule Postback!');
          bot.reply(message, 'Here are your courses for this semester.');

          getSchedule(message.user, controller, bot, message)
          .then((scheduleMsg) => {
            bot.reply(message, scheduleMsg);
          })
          .catch((e) => {
            console.log('Error');
            console.log(e);
            bot.reply(message, e);
          });
          break;

        case 'getUpcomingHw':
          console.log('Assignments Postback!');
          if (!data) {
            getCoursesEnrolled(message.user, controller)
            .then((courses) => {
              bot.startConversation(message, (err, convo) => {
                convo.say('Here are your upcoming assignments from all your classes.');
                courses.forEach((tempCourse) => {
                  convo.say('');
                  displayCourseUpcomingHw(convo, message, controller, tempCourse)
                  .then((returnAttachments) => {
                    returnAttachments.forEach((a) => {
                      console.log('a is');
                      console.log(a);
                      convo.say(a);
                    });
                  });
                });
              });
            });
          } else {
            bot.startConversation(message, (err, convo) => {
              displayCourseUpcomingHw(convo, message, controller, data)
              .then((returnAttachments) => {
                returnAttachments.forEach((a) => {
                  convo.say(a);
                });
              });
            });
          }
          break;

        case 'getAnnouncements':
          console.log('Class Announcements Postback!');
            if (!data) {
              getCoursesEnrolled(message.user, controller)
              .then((courses) => {
                bot.startConversation(message, (err, convo) => {
                  convo.say('Here are the announcements from all your classes.');
                  courses.forEach((tempCourse) => {
                    convo.say('');  // Hack, needed for convo to work
                    displayCourseAnnouncements(convo, message, controller, tempCourse)
                    .then((returnAttachments) => {
                      returnAttachments.forEach((a) => {
                        convo.say(a);
                      });
                    });
                  });
                });
              });
            } else {
              bot.startConversation(message, (err, convo) => {
                displayCourseAnnouncements(convo, message, controller, data)
                .then((returnAttachments) => {
                  returnAttachments.forEach((a) => {
                    convo.say(a);
                  });
                });
              });
            }
          break;

        case 'getGrades':
          console.log('Class Grades Postback!');

          bot.startConversation(message, (err, convo) => {
            if (!data) {
              convo.say('Here are the grades from all your classes.');
              getCoursesEnrolled(message.user, controller)
              .then((courses) => {
                courses.forEach((tempCourse) => {
                  displayCourseGrades(convo, message, controller, tempCourse);
                });
              });
            } else {
              displayCourseGrades(convo, message, controller, data);
            }
          });
          break;

        case 'help':
          sendHelpCommandMessage(bot, message);
          break;

        default:
          break;
      }
    } catch (exception) {
      console.log('Exception! JSON parse did not work');
    }
  });

  return controller;
};

exports.alterUserCourseSubscriptions = alterUserCourseSubscriptions;

exports.sendHelpCommandMessage = sendHelpCommandMessage;
