angular.module('starter.controllers', [])

.controller('StatusCtrl', function($scope, $http, $filter, CurrentState, MyAreas) {
	$scope.status = {error: "Getting status..."};
	
	var getAndPush = function(tempArea) {
		$http.get('http://whereismypower.co.za/api/get_schedule?area=' + tempArea.area_id + '&date=today&stage=' + CurrentState.get())
			.success(function(data, status, headers, config){
				var card = tempArea,
					now = $filter('date')(new Date(), 'HH:mm'),
					outages = data.outages.split(', ');
				card.outages = data.outages;
				card.nowShedding = false;
				for (var y=0; y<outages.length; y++) {
					var times = outages[y].split(' - ');
					if ((times[0] < now) && (times[1] > now)) {
						card.nowShedding = true;
					}
				}
				$scope.areaCards.push(card);
			})
			.error(function(data, status, headers, config){
				console.log("failed to get outages for area " + status);		
			});
	};
	
	$scope.refreshStatus = function() {
		$http.get("http://whereismypower.co.za/api/get_status")
			.success(function(data, status, headers, config){
				$scope.status = data;
				CurrentState.set($scope.status.active_stage);
				
				$scope.myAreas = MyAreas.all();
				$scope.areaCards = [];
				for (var x=0; x<$scope.myAreas.length; x++) {
					var temp = $scope.myAreas[x];
					getAndPush(temp);				
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

})

.controller('AboutCtrl', function($scope) {
	
});
