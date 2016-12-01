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
          simplifiedAssigments.sort( function (a, b) {
            return a.due_at < b.due_at;
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
          console.log(simplifiedAnnouncments);

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
                      courseSectionTimes += `${meet.meetDays}: ${meet.meetTimeBegin} - ${meet.meetTimeEnd}\n`;
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
      } // else if (user.canvas.token)...
      else {
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
* Display all the upcoming assignments given a course ID.
* First query te upcoming assignments and then display as a list of generics
*/
function displayCourseUpcomingHw(bot, message, controller, data) {
  getCourseAssignments(message.user, controller, data.course_id, bot, message)
  .then((assignmentsMsg) => {
    if (assignmentsMsg.length > 0) {
      bot.reply(message, 'Here are your upcoming assignments from ' + data.course_name);

      assignmentsMsg.forEach((tempAssigmentMsg) => {
        //  console.log(tempAssigmentMsg.name);

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
                  // item_url: tempAssigmentMsg.html_url,
                  default_action: {
                    type: 'web_url',
                    url: tempAssigmentMsg.html_url,
                  },
                  //image_url: `${SERVER_URL}assets/upcoming_hm.png`,
                },
              ],
            },
          };
          bot.reply(message, { attachment });
        }
      });
    } else {
      bot.reply(message, 'There are no assignments posted at this time. Check back later.');
    }
  })
  .catch((e) => {
    console.log('Error');
    console.log(e);
    bot.reply(message, e);
  });
}

/*
* Display all the announcments given a course ID.
* First query te announcments and then display as a list of generics
*/
function displayCourseAnnouncements (bot, message, controller, data) {
  getCourseAnnouncements(message.user, controller, data.course_id, bot, message)
  .then((announcementsMsg) => {
    const attachment = {
      type: 'template',
      payload: {
        template_type: 'list',
        top_element_style: 'compact',
        elements: [

        ],
        buttons: [
          {
            title: 'More Announcements',
            type: 'web_url',
            url: CANVAS_URL + 'courses/' + data.course_id + '/announcements',
          },
        ],
      },
    };
    for (let i = 0; i < (announcementsMsg.length && 4); i += 1) {
      const tempAnnouncementMsg = announcementsMsg[i];
      const postedDate = moment(tempAnnouncementMsg.posted_at).format('MMMM Do YYYY, h:mm:ss a');
      const newAnnouncementElement = {
        title: tempAnnouncementMsg.title,
        subtitle: 'Posted at: ' + postedDate,
        default_action: {
          type: 'web_url',
          url: tempAnnouncementMsg.html_url,
        },
        buttons: [
          {
            title: 'Read More',
            type: 'web_url',
            url: tempAnnouncementMsg.html_url,
          },
        ],
      };
      attachment.payload.elements.push(newAnnouncementElement);
    }
    bot.reply(message, 'Here are the announcements from ' + data.course_name);
    bot.reply(message, { attachment });
  })
  .catch((e) => {
    console.log('Error');
    console.log(e);
    bot.reply(message, e);
  });
}

// Take in the Botkit controller and attach events to it
module.exports = (controller) => {
  // This is triggered when a user clicks the send-to-messenger plugin
  controller.on('facebook_optin', (bot, message) => {
    bot.reply(message, 'Welcome, friend');
  });

  // This is triggered when a user clicks the send-to-messenger plugin
  controller.on('message_delivered', (bot, message) => {
    console.log(message);
    console.log('message delivered');
  });

  // This is triggered when a user clicks the send-to-messenger plugin
  // payload comes in the JSON form: { action: String, data: Object }
  controller.on('facebook_postback', (bot, message) => {
    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~');
    console.log('Facebook Postback Occured!');

    const payload = JSON.parse(message.payload);
    const { action, data } = payload;

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
          bot.reply(message, 'Here are your upcoming assignments from all your classes.');
          getCoursesEnrolled(message.user, controller, bot, message)
          .then((courses) => {
            courses.forEach((tempCourse) => {
              displayCourseUpcomingHw(bot, message, controller, tempCourse);
            });
          });
        } else {
          displayCourseUpcomingHw(bot, message, controller, data);
        }
        break;

      case 'getAnnouncements':
        console.log('Class Announcements Postback!');
        if (!data) {
          bot.reply(message, 'Here are the announcements from all your classes.');
          getCoursesEnrolled(message.user, controller, bot, message)
          .then((courses) => {
            courses.forEach((tempCourse) => {
              displayCourseAnnouncements(bot, message, controller, tempCourse);
            });
          });
        } else {
          displayCourseAnnouncements(bot, message, controller, data);
        }
        break;

      case 'getGrades':
        console.log('Class Grades Postback!');
        if (!data) {
          bot.reply(message, 'Here are the grades from all your classes.');
        } else {
          bot.reply(message, 'Here are the grades from ' + data.course_name);

          getCourseGrades(message.user, controller, data.course_id, bot, message)
          .then((gradesMsg) => {
            if(gradesMsg.grades.length > 0){
              gradesMsg.grades.forEach((gradeMsg) => {
                // console.log("*************************");
                // console.log(gradeMsg);
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
                      },
                    ],
                  },
                };
                bot.reply(message, { attachment });
              });
              // Total grade as now.
              bot.reply(message, 'Total grade: ' + gradesMsg.computed_current_score + '%');
            } else {
              bot.reply(message, 'There are no grades at this time. Check back later.');
            }
          })
          .catch((e) => {
            console.log('Error');
            console.log(e);
            bot.reply(message, e);
          });
        }
        break;

      case 'help':
        console.log('Help Postback!');
        bot.reply(message, 'Here are some of the things you can use me for.');
        // sendMsg(help)
        break;
      default:
    }
  });

  return controller;
};

exports.alterUserCourseSubscriptions = alterUserCourseSubscriptions;
