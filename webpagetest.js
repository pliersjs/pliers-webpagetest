module.exports = function (pliers, taskName, url, key, location) {

  pliers(taskName, function (done) {
    var options = {
          url: url
        , key: key
        , location: location
        , wptInstance: 'www.webpagetest.org'
        , connectivity: ''
        , bandwidthDown: ''
        , bandwidthUp: ''
        , latency: ''
        , packetLossRate: ''
        , login: ''
        , password: ''
        , authenticationType: ''
        , video: 1
        , runs: 1
        , budget: {
            visualComplete: ''
          , render: '5000'
          , loadTime: ''
          , docTime: ''
          , fullyLoaded: ''
          , bytesIn: ''
          , bytesInDoc: ''
          , requests: ''
          , requestsDoc: ''
          , SpeedIndex: '5000'
          }
        }
      , testId
      , curStatus
      , myTimer
      , processData = function(data) {
        // takes the data returned by wpt.getTestResults and compares
        // to our budget thresholds
        pliers.logger.info(data.processData)

        var budget = options.budget
          , summary = data.data.summary
          , median = data.data.median.firstView
          , pass = true
          , str = ''

          for (var item in budget) {
            // make sure this is objects own property and not inherited
            if (budget.hasOwnProperty(item)) {
              //make sure it exists
              if (budget[item] !== '' && median.hasOwnProperty(item)) {
                if (median[item] > budget[item]) {
                  pass = false;
                  str += item + ': ' + median[item] + ' [FAIL]. Budget is ' + budget[item] + '\n';
                } else {
                  str += item + ': ' + median[item] + ' [PASS]. Budget is ' + budget[item] + '\n';
                }
              }
            }
          }

          //output our header and results
          if (!pass) {
            pliers.logger.info('\n\n-----------------------------------------------' +
                  '\nTest for ' + options.url + ' \t  FAILED' +
                '\n-----------------------------------------------\n\n');
            pliers.logger.info(str);
            pliers.logger.info('Summary: ' + summary);
            done();
          } else {
            pliers.logger.info('\n\n-----------------------------------------------' +
                  '\nTest for ' + options.url + ' \t  PASSED' +
                '\n-----------------------------------------------\n\n');
            pliers.logger.info(str);
            pliers.logger.info('Summary: ' + summary);
            done();
          }
        }
        , retrieveResults = function() {
          var response;
          // try to get the results for the test
          wpt.getTestResults(testId, function(err, data) {
            response = data.response;
            if (response.statusCode === 200) {
              //yay! Let's process it now
              processData(response);
            } else {
              if (response.statusCode !== curStatus) {
                //update status so folks now we haven't died on them
                pliers.logger.info( (response.statusText + '...').cyan );
                curStatus = response.statusCode;
              }
              //check again later
              myTimer = setTimeout(function(testId) {
                retrieveResults(testId);
              }, 1000);
            }
          });
        }
        , WebPageTest = require('webpagetest')
        , wpt = new WebPageTest(options.wptInstance, options.key)
        , reserved = [ 'key', 'url', 'budget', 'wptInstance' ]
        , toSend = {}

        for (var item in options) {
          if (reserved.indexOf(item) === -1 && options[item] !== '') {
            toSend[item] = options[item];
          }
        }

        // run the test
        wpt.runTest(options.url, toSend, function(err, data) {
          if (err) {
            // ruh roh!
            pliers.logger.info(err);
          } else if (data.statusCode === 200) {
            // yay! Let's let them know the test is running.
            pliers.logger.info( ('Running test...').cyan );

            testId = data.data.testId;
            //and we have an ID!
            pliers.logger.info( ('Test ID ' + testId + ' obtained....').cyan );

            //now try to get the actual results
            retrieveResults(testId);
          } else {
            // ruh roh! Something is off here.
            pliers.logger.info(data.statusText);
          }
        });
    done()
  })

}
