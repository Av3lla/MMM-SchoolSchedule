/* Magic Mirror
* Module: SchoolSchedule
*
* By Avella https://github.com/Av3lla
* MIT Licensed.
*/

Module.register("SchoolSchedule", {
  defaults: {
    key: null,
    schoolName: null,
    loadDates: 7,
    maxIndex: 7,
    updateInterval: 1000 * 60 * 60
  },
  
  start: function() {
    // set global variables
    this.scheduleDates = '';
    this.scheduleNames = '';
    this.isThereSchedule;
    var self = this;
    Log.info("Starting module: " + this.name);
    // load data
    this.load()
    // schedule refresh
    setInterval(function() {
      self.updateDom();
    }, this.config.updateInterval)
  },
  
  load: function() {
    this.getSchoolInfo();
  },
  
  getStyles: function() {
    return ["SchoolSchedule.css"];
  },
  
  getHeader: function() {
    return "학사일정";
  },
  
  getSchoolInfo: async function() {
    // request
    const url = "https://open.neis.go.kr/hub/schoolInfo";
    const requestUrl = `${url}?Key=${this.config.key}&Type=${'json'}&pIndex=${1}&pSize=${100}&SCHUL_NM=${this.config.schoolName}`;
    // fetch
    const schoolInfo = await fetch(requestUrl)
    .then(rawResponse => {
      return rawResponse.json();
    })
    .catch(error => {
      console.error(error);
    });
    // get school code from schoolInfo
    const result = schoolInfo.schoolInfo[1].row[0];
    const eduCode = result.ATPT_OFCDC_SC_CODE;
    const schoolCode = result.SD_SCHUL_CODE;
    fullSchoolName = result.SCHUL_NM;
    //get schedule
    this.getSchedule(eduCode, schoolCode);
  },
  
  getSchedule: async function(eduCode, schoolCode) {
    //const date = new Date('2022-03-01');
    const date = new Date();
    const fromDate = date.toISOString().replace(/-/g, '').slice(0, 8);
    let toDate = date;
    toDate.setDate(toDate.getDate() + this.config.loadDates);
    toDate = toDate.toISOString().replace(/-/g, '').slice(0, 8);
    // request
    const url = "https://open.neis.go.kr/hub/SchoolSchedule";
    const requestUrl = `${url}?Key=${this.config.key}&Type=${'json'}&pIndex=${1}&pSize=${this.config.maxIndex}&ATPT_OFCDC_SC_CODE=${eduCode}&SD_SCHUL_CODE=${schoolCode}&AA_FROM_YMD=${fromDate}&AA_TO_YMD=${toDate}`;
    // fetch
    let rawScheduleData = await fetch(requestUrl)
    .then(rawResponse => {
      return rawResponse.json();
    })
    .catch(error => {
      console.error(error);
    });
    try {
      const scheduleData = rawScheduleData.SchoolSchedule[1].row;
      for (i of scheduleData) {
        if (i.EVENT_NM === "토요휴업일") {
          continue;
        } else {
          this.scheduleDates += i.AA_YMD.slice(4, 9) + '</br>';
          this.scheduleNames += i.EVENT_NM.slice(0, 12) + '</br>';
        }
      }
      this.isThereSchedule = true;
    } catch (error) {
      console.error(error);
      if (error.name === "TypeError") {
        this.isThereSchedule = false;
      }
    }
    this.updateDom();
  },
  
  getDom: function() {
    var mainDiv = document.createElement("div");
    mainDiv.className = "scheduleMain";
    var scheduleDiv = document.createElement("div");
    scheduleDiv.className = "schedule";
    var scheDatesDiv = document.createElement("div");
    scheDatesDiv.className = "scheDates";
    var scheNamesDiv = document.createElement("div");
    scheNamesDiv.className = "scheNames";
    var exceptionDiv = document.createElement("div");
    exceptionDiv.className = "exception";
    var exceptionTextDiv = document.createElement("div");
    var developedbyDiv = document.createElement("div");
    developedbyDiv.className = "devby";
    developedbyDiv.innerHTML = "이지원 Github @Av3lla";
    
    if (!this.isThereSchedule) {
      exceptionTextDiv.innerHTML = "설정한 기간 중 학사일정이 없습니다.";
      exceptionDiv.append(exceptionTextDiv, developedbyDiv);
      return exceptionDiv;
    } else {
      scheDatesDiv.innerHTML = this.scheduleDates;
      scheNamesDiv.innerHTML = this.scheduleNames;
    }
    
    scheduleDiv.append(scheDatesDiv, scheNamesDiv);
    mainDiv.append(scheduleDiv, developedbyDiv);
    return mainDiv;
  }
});