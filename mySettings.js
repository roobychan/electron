'use strict';

myApp.controller('mySettings', ['$scope', function($scope) {
	$scope.setAPIKey = settings.apiKey;
	$scope.setURL = settings.url;
	$scope.setDev = settings.dev;
	this.create = () => {
		settings.url = $scope.setURL;
		settings.apiKey = $scope.setAPIKey;
		settings.dev = $scope.setDev;
		fs.writeFileSync('./settings.json',JSON.stringify(settings));
		settings = JSON.parse(fs.readFileSync('./settings.json',{encoding: 'utf-8'}));
		console.log(settings);
		restAPI = rally({apiKey: settings.apiKey});
		process.env.http_proxy = settings.url;
  		process.env.https_prox = settings.url;
	};
}]);