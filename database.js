// Location Class
function Location (loc_id, company, country, state, city, lat, lng) {
  this.loc_id = loc_id;
  this.company = company;
  this.country = country;
  this.state = state;
  this.city = city;
  this.lat = parseFloat(lat);
  this.lng = parseFloat(lng);
}

// Student Class
function Student (st_id, name, degree, grad_year, school, jobs) {
  this.st_id = st_id;
  this.name = name;
  this.degree = degree;
  this.grad_year = grad_year;
  this.school = school;
  this.jobs = jobs;
}

// Job Class
function Job (job_id, st_id, loc_id, title, date) {
  this.job_id = job_id;
  this.st_id = st_id;
  this.loc_id = loc_id;
  this.title = title;
  this.date = date;
}

// Marker Class
function Marker (location) {
  this.location = location;
  this.jobs = [];
  this.addJob = function(job) {
        this.jobs.push(job);
    };
}

// Global Variables
var rootRef = firebase.database().ref().child("/public");
var db_obj;
var db_JSON;
var locations = [];
var students = [];
var jobs = [];
var markers = [];
var gmarkers = [];

var location_strs = [];
var student_strs = [];

var loc_size = 0;
var st_size = 0;
var job_size = 0;
var location_table_data = [];
var student_table_data = [];
var job_table_data = [];
var loc_obj;
var st_obj;
var job_obj;

var map;
var gmap_obj;
var gmap_default_lat = 0;
var gmap_default_lng = 0;
var gmap_default_zoom = 1;

// -------------------------------------------------------------------------- //

// Load database values
function loadDatabase(snapshot) {

  db_obj = snapshot.val();

  snapshot.forEach(function(childSnapshot) {

    // Get objects and sizes
    if (childSnapshot.key == "locations") {
      loc_obj = childSnapshot.val();
    }
    else if (childSnapshot.key == "students") {
      st_obj = childSnapshot.val();
    }
    else if (childSnapshot.key == "jobs") {
      job_obj = childSnapshot.val();
    }
    else if (childSnapshot.key == "gmap") {
      gmap_obj = childSnapshot.val();
    }

  });

  // Set gmap variables
  gmap_default_lat = gmap_obj.default_lat;
  gmap_default_lng = gmap_obj.default_lng;
  gmap_default_zoom = gmap_obj.default_zoom;

  // Create location class array
  Object.keys(loc_obj).forEach(function(key) {
    if(key != "loc_0") {
      var obj = loc_obj[key];
      var location = new Location(key, obj.company, obj.country, obj.state, obj.city, obj.lat, obj.lng);
      locations.push(location);
      location_table_data.push([obj.company, obj.country, obj.state, obj.city, obj.lat, obj.lng, key])
      location_strs.push(obj.company + " - " + obj.country + ", " + obj.state + ", " + obj.city);
      loc_size = loc_size + 1;
    }
  });

  // Run through students
  Object.keys(st_obj).forEach(function(key) {
    if(key != "st_0") {
      var obj = st_obj[key];
      var student = new Student(key, obj.name, obj.degree, obj.grad_year, obj.school);
      students.push(student);
      student_table_data.push([obj.name, obj.school, obj.degree, obj.grad_year, key]);
      student_strs.push(obj.name + " - " + obj.school + " - " + obj.degree);
      st_size = st_size + 1;
    }
  });

  // Create jobs class array
  Object.keys(job_obj).forEach(function(key) {
    if(key != "job_0") {
      var obj = job_obj[key];
      var job = new Job(key, obj.st_id, obj.loc_id, obj.title, obj.date);
      jobs.push(job);
      job_table_data.push([loc_obj[obj.loc_id].company, st_obj[obj.st_id].name, obj.title, obj.date, obj.loc_id, obj.st_id, key]);
      job_size = job_size + 1;
    }
  });

}

// -------------------------------------------------------------------------- //

// Return array of companies stored in database
function getCompanies() {
  var companies = [];
  for (var i = 0; i < locations.length; i++) {
    companies.push(locations[i].company);
  }
  return uniq(companies);
}

// Check if location already exist in database
function isNewLocation(company, country, state, city){

  for (var i = 0; i < locations.length; i++) {
    if (locations[i].company == company &&
        locations[i].country == country &&
        locations[i].state == state &&
        locations[i].city == city) {
      return false;
    }
  }

  return true;
}

// Check if student already exist in database
function isNewStudent(name, school, degree, grad_year){

  for (var i = 0; i < students.length; i++) {
    if (students[i].name == name &&
        students[i].school == school &&
        students[i].degree == degree &&
        students[i].grad_year == grad_year) {
      return false;
    }
  }

  return true;
}

// Download database as JSON file
function exportDatabase() {

  firebase.database().ref().child("/moderators").once('value', function(snapshot) {
    var mod = snapshot.val();
    var obj = {"moderators" : mod};
    obj["public"] = db_obj;
    dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(obj));
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "GlobalNL_JobMap_Database_Private.json");
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }, function(error) {
    var obj = {"public" : db_obj};
    dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(obj));
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "GlobalNL_JobMap_Database_Public.json");
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  });

}

// Return unique array
function uniq(a) {
    return a.sort().filter(function(item, pos, ary) {
        return !pos || item != ary[pos - 1];
    })
}


// Moderator Database Functions

function moveFbRecord(oldRef, newRef) {
    console.log("move");
     oldRef.once('value', function(snap)  {
          newRef.set( snap.val(), function(error) {
               if( !error ) {  oldRef.remove(); }
               else if( typeof(console) !== 'undefined' && console.error ) {  console.error(error); }
          });
     });
}

function copyFbRecord(oldRef, newRef) {
     oldRef.once('value', function(snap)  {
          newRef.set( snap.val(), function(error) {
               if( error && typeof(console) !== 'undefined' && console.error ) {  console.error(error); }
          });
     });
}
