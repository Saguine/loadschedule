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

/**
 * A simple example service that returns some data.
 */
.factory('Friends', function() {
  // Might use a resource here that returns a JSON array

  // Some fake testing data
  var friends = [{
    id: 0,
    name: 'Ben Sparrow',
    notes: 'Enjoys drawing things',
    face: 'https://pbs.twimg.com/profile_images/514549811765211136/9SgAuHeY.png'
  }, {
    id: 1,
    name: 'Max Lynx',
    notes: 'Odd obsession with everything',
    face: 'https://avatars3.githubusercontent.com/u/11214?v=3&s=460'
  }, {
    id: 2,
    name: 'Andrew Jostlen',
    notes: 'Wears a sweet leather Jacket. I\'m a bit jealous',
    face: 'https://pbs.twimg.com/profile_images/491274378181488640/Tti0fFVJ.jpeg'
  }, {
    id: 3,
    name: 'Adam Bradleyson',
    notes: 'I think he needs to buy a boat',
    face: 'https://pbs.twimg.com/profile_images/479090794058379264/84TKj_qa.jpeg'
  }, {
    id: 4,
    name: 'Perry Governor',
    notes: 'Just the nicest guy',
    face: 'https://pbs.twimg.com/profile_images/491995398135767040/ie2Z_V6e.jpeg'
  }];


  return {
    all: function() {
      return friends;
    },
    get: function(friendId) {
      // Simple index lookup
      return friends[friendId];
    }
  }
});
