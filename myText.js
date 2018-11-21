'use strict';
// const sqlite3 = require('sqlite3');
// let db = new sqlite3.Database('./myRally.db', (err) => {
// 	if (err) {
// 		return console.error(err.message);
// 	}
// });
// db = new loki('./resources/app/myRally.json', {autosave: true, autoload:true});
db = new loki('./myRally.json', {autosave: true, autoload:true});
myApp.controller('myTextController', ['$scope', '$http', function($scope, $http) {
	$scope.usID = '';
	$scope.usText = '';
	$scope.no_db = settings.no_db;
	this.create = () => {
		$scope.usText = this.getUSText($scope.usID);
		clipboard.writeText($scope.usText);
	};
	this.getUSText = (usID, callback) => {
		let itList = [];
		let usList = [];
		let result = '';
		console.log(db.listCollections());
		let col = db.getCollection('userStory');
		usList = col.find({usID: usID});
		if (usList[0]) {
			col = db.getCollection('itert');
			let u = usList[0];
			itList = col.find({itert:u.itert, project: u.project});
			if (itList[0]) {
				let i = itList[0];
				result = `${u.crm}|${i.pd1}|${i.pqx}|${i.ppx}|${u.owner}|${u.utype}|${u.app}|${u.usid}|${u.desp}|${u.itert}`;
				return result;
			}
		}
	};
}]);