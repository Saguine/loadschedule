angular.module('starter.services', [])

.factory('Areas', function() {
  var areas = [];

  return {
    all: function() {
      return areas;
    },
    set: function(addedAreas) {
    	areas = addedAreas;
    },
    get: function(areaId) {
      for (var i = 0; i < areas.length; i++) {
        if (areas[i].area_id === parseInt(areaId)) {
          return areas[i];
        }
      }
      return null;
    }    
  }
})

.factory('MyAreas', function() {
	  if (!window.localStorage["areas"]) {
		  window.localStorage["areas"] = JSON.stringify([]);
	  }
	  var myAreas = JSON.parse(window.localStorage["areas"]);

	  return {
	    all: function() {
	      return myAreas;
	    },
	    remove: function(areaId) {
	      for (var i = 0; i < myAreas.length; i++) {
	        if (myAreas[i].area_id === parseInt(areaId)) {
	          myAreas.splice(i, 1);
	          window.localStorage["areas"] = JSON.stringify(myAreas);
	          return;
	        }
	      }
	    },
	    add: function(area) {
	    	this.remove(area.area_id);
	    	myAreas.push(area);
	    	window.localStorage["areas"] = JSON.stringify(myAreas);
	    },
	    has: function(areaId) {
	      for (var i = 0; i < myAreas.length; i++) {
	        if (myAreas[i].area_id === parseInt(areaId)) {
	          return true;
	        }
	      }
	      return false;
	    }
	  }
	})
	
.service('CurrentState', function() {
	var currentState = 0;
	return {
		get: function() {
			return currentState;
		},
		set: function(newCurrentState) {
			currentState = newCurrentState;
		}
	};
})

.factory('Friends', function() {
	
});
