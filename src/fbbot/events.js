
import axios from 'axios';
import config from 'config-heroku';

import sendUtils from './sendUtils';

const ONE_COURSE_API = config.ONE_COURSE_API;

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
              const courseRe = /([a-z]{3}[0-9]{4})/i;
              const courseCode = course.course_code;
              const cleanCourseCode = courseCode.match(courseRe)[0];
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
            }); // const promises = courses.map...

            axios.all(promises)
              .then((res) => {
                // returnMessage is the final string of Course codes and times
                let returnMessage = '';
                const resDatas = res.map(r => r.data);

                // For each One UF course...
                resDatas.forEach((course) => {
                  // Extract the relevant data from the JSON
                  const matchedCourse = JSON.parse(course[0].COURSES)[0];
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
                      if (canvasSection.name === section.number) {
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
        if (subscribedCourses.includes(course)) {
          return;
        }
        subscribedCourses.push(course);
      } else {
        const indexOfCourse = subscribedCourses.indexOf(course);
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
    console.log('message');
    console.log(message);

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
        console.log('Upcomming HW Postback!');
        if (!data){
          bot.reply(message, 'Here are your upcomming HW from all your classes.');
        }else{
          bot.reply(message, 'Here are your upcomming HW from all the class with ID = ' + data);
        }
        // retrieveUpcomingHw
        // sendMsg(upcommingHw)
        break;
      case 'getAnnouncements':
        console.log('Class Announcements Postback!');
        if (!data){
          bot.reply(message, 'Here are the announcements from all your classes.');
        }
        else {
          bot.reply(message, 'Here are the announcements from the class with ID = ' + data);
        }
        // retrieveAnnouncemnets
        // sendMsg(announcements)
        break;
        case 'getGrades':
          console.log('Class Grades Postback!');
          if (!data){
            bot.reply(message, 'Here are the grades from all your classes.');
          }
          else {
            bot.reply(message, 'Here are the grades from the class with ID = ' + data);
          }
          // retrieveGrades
          // sendMsg(grades)
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
