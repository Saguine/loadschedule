angular.module('starter.controllers', ['ionic', 'ngCordova'])

.controller('StatusCtrl', function($rootScope, $scope, $http, $filter, $interval, $ionicPlatform, $cordovaLocalNotification, $cordovaBatteryStatus, CurrentState, MyAreas) {
	$scope.status = {error: "Getting status..."};
	var lastStage = null;
	var areaHistory = {};
	var batteryLevel = null;
	
	var dismiss = function(area, battery) {
		for (id in areaHistory) {
			if (area) {
				areaHistory[id].dismissed = true;
			}
			
			if (battery) {
				areaHistory[id].batteryDismissed = true;
			}
		}
	};
	$ionicPlatform.ready(function() {
		$cordovaLocalNotification.cancel('area_start').then(function() {
			dismiss(true, false);
		});
		$cordovaLocalNotification.cancel('battery_warning').then(function() {
			dismiss(false, true);
		});
		
		$rootScope.$on('$cordovaBatteryStatus:status', function(result) {
			for (k in result) {
				console.log(k);
			}
			batteryLevel = result.level;
			console.log('Battery level: ' + batteryLevel);
		}, false);
	/*	$cordovaLocalNotification.click('area_start').then(function() {
			$state.go('tab.status');
			dismiss(true, true);
		});
		$cordovaLocalNotification.click('battery_warning').then(function() {
			$state.go('tab.status');
			dismiss(true, true);
		}); */
	});
	
	var getAndPush = function(tempArea) {
		$http.get('http://whereismypower.co.za/api/get_schedule?area=' + tempArea.area_id + '&date=today&stage=' + CurrentState.get())
			.success(function(data, status, headers, config){
				var card = tempArea,
					now = $filter('date')(new Date(), 'HH:mm'),
					outages = data.outages.split(', '),
					alarms = null;
				if (window.localStorage['alarms']) {
					alarms = JSON.parse(window.localStorage['alarms']);
				}
				card.outages = data.outages;
				card.nowShedding = false;
				card.upcoming = false;
				var next = null;
				for (var y=0; y<outages.length; y++) {
					var times = outages[y].split(' - ');
					if ((times[0] < now) && (times[1] > now)) {
						card.nowShedding = true;
					} else if (times[0] > now && next == null) {
						next = times[0];
					}
					
					var oneHourAhead = $filter('date')(new Date(new Date().getTime() + 3600000));
					if (card.nowShedding == false && (times[0] < oneHourAhead) && (times[1] > oneHourAhead)) {
						card.upcoming = true;
					}
				}
				$scope.areaCards.push(card);
				
				if (alarms && next) {
					if (areaHistory[data.area_id]) {
						if (next != null && areaHistory[data.area_id].nextStart != next) {
							// changed, reset notification, else leave alone
							areaHistory[data.area_id].nextStart = next;
							areaHistory[data.area_id].dismissed = false;
							areaHistory[data.area_id].batteryDismissed = false;
						}
					} else {
						areaHistory[data.area_id] = {
							nextStart: next,
							dismissed: false,
							batteryDismissed: false,
						};
					}
					
					var nowHrs = parseInt(now.split(':')[0]),
						nowMins = nowHrs * 60 + parseInt(now.split(':')[1]),
						hrs = parseInt(areaHistory[data.area_id].nextStart.split(':')[0]),
						mins = hrs * 60 + parseInt(areaHistory[data.area_id].nextStart.split(':')[1]),
						diffMins = mins - nowMins;
					
					if (!areaHistory[data.area_id].dismissed && 
							alarms.myAreaStartLoadshedding.on && 
							diffMins < alarms.myAreaStartLoadshedding.warningTime) {
							//TODO fire notification, area warn
						$cordovaLocalNotification.add({
							id: 'area_starting',
							message: 'Loadshedding will start soon in one of your areas.'
						});
					}
						
					if (!areaHistory[data.area_id].batteryDismissed && 
							alarms.batteryWatcher.on &&
							diffMins < alarms.batteryWatcher.timeWindow &&
							batteryLevel < alarms.batteryWatcher.batteryThreshold) {
							//TODO fire battery notification	
						$cordovaLocalNotification.add({
							id: 'battery_warning',
							message: 'Your battery is low, and loadshedding will start soon!'
						});
					}
					
				}
			})
			.error(function(data, status, headers, config){
				console.log("failed to get outages for area " + status);		
			});
	};
	
	$scope.refreshStatus = function() {
		$http.get("http://whereismypower.co.za/api/get_status")
			.success(function(data, status, headers, config){
				var alarms = null;
				if (window.localStorage['alarms']) {
					alarms = JSON.parse(window.localStorage['alarms']);
				}
				$scope.status = data;
				CurrentState.set($scope.status.active_stage);
				
				$scope.myAreas = MyAreas.all();
				$scope.areaCards = [];
				for (var x=0; x<$scope.myAreas.length; x++) {
					var temp = $scope.myAreas[x];
					getAndPush(temp);				
				};

		    	if (lastStage && alarms) {
		    		if (alarms.stageChange.on && lastStage != data.active_stage) {
		    			if ((alarms.stageChange.type === 'UP' && data.active_stage > lastStage) || 
		    					(alarms.stageChange.type === 'DOWN' && data.active_stage < lastStage) || 
		    					(alarms.stageChange.type === 'ANY')) {
		    				var message = 'Load shedding stage changed from ' +
		    					$filter('stage')(lastStage) + ' to ' +
		    					$filter('stage')(data.active_stage) + '.';
		    				
		    				//TODO fire notification
		    				$cordovaLocalNotification.add({
		    					id: 'stage_change',
		    					date: data.timestamp,
		    					message: message,
		    				});
		    			}
		    		}
		    		lastStage = data.active_stage;
		    	} else {
		    		lastStage = data.active_stage;
		    	}
			})
			.error(function(data, status, headers, config){
				console.log("failed to get status");
				$scope.status = {error: status};			
			})
			.finally(function() {
			    $scope.$broadcast('scroll.refreshComplete');
			});
	}
	$scope.refreshStatus();	
	
	$interval($scope.refreshStatus, 150000); // check every 2.5 minutes
})

.controller('ScheduleCtrl', function($scope, $http, Areas, MyAreas) {
	$http.get('http://whereismypower.co.za/api/list_areas')
		.success(function(data, status, headers, config){
			$scope.areas = data;
			Areas.set(data);
		})
		.error(function(data, status, headers, config){
			console.log("failed to get areas");		
		});
	
	$scope.myAreas = MyAreas.all();
})

.controller('AreaCtrl', function($scope, $http, $stateParams, $filter, Areas, MyAreas, CurrentState) {
	$scope.area = Areas.get($stateParams.areaId);
	$scope.settings = {isMyArea: MyAreas.has($stateParams.areaId)};
	
	$scope.$watch('settings', function() {
		if ($scope.settings.isMyArea) {
			MyAreas.add($scope.area);
		} else {
			MyAreas.remove($scope.area.area_id);
		}
	}, true);
	
	$scope.result = null;
	$scope.check = {date: '', stage: CurrentState.get()};
	$scope.$watch('check', function() {
		var date = $scope.check.date;
		if (date === '') {
			return;
		}
		var dateString = $filter('date')(date, 'YYYY-MM-dd');
		$http.get('http://whereismypower.co.za/api/get_schedule?area=' + $scope.area.area_id + '&date=' + dateString + '&stage=' + $scope.check.stage)
			.success(function(data, status, headers, config){
				$scope.result = data.outages;
			})
			.error(function(data, status, headers, config){
				console.log("failed to get outages for area " + status);		
			});
	}, true);
	
	$scope.today = null;
	$scope.nowShedding = false;
	$http.get('http://whereismypower.co.za/api/get_schedule?area=' + $scope.area.area_id + '&date=today&stage=' + CurrentState.get())
		.success(function(data, status, headers, config){
			$scope.today = data.outages;
			var outages = data.outages.split(", ");
			var now = $filter('date')(new Date(), 'HH:mm');
			for (var x=0; x<outages.length; x++) {
				var times = outages[x].split(' - ');
				if ((times[0] < now) && (times[1] > now)) {
					$scope.nowShedding = true;
				}
			}
		})
		.error(function(data, status, headers, config){
			console.log("failed to get outages for area " + status);		
		});
})

.controller('AlarmCtrl', function($scope) {
	if (window.localStorage["alarms"]) {
		$scope.alarms = JSON.parse(window.localStorage["alarms"]);
	} else {
		$scope.alarms = {
			on: false,
			stageChange: {
				on: false,
				type: "ANY"
			},
			myAreaStartLoadshedding: {
				on: false,
				warningTime: 30
			},
			batteryWatcher: {
				on: false,
				batteryThreshold: 55,
				timeWindow: 30
			}
		}
	}
	
	$scope.$watch('alarms', function(){
		window.localStorage["alarms"] = JSON.stringify($scope.alarms);
	}, true);
})

.controller('AboutCtrl', function($scope) {
	
})

.controller('NotificationCtrl', function($scope) {
	
});
