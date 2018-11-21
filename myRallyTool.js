'use strict';

const rally = require('rally');
const async = require('async');
const loki= require('lokijs');
const {clipboard} = require('electron');
const {dialog} = require('electron').remote;
const fs = require('fs');
var settings = JSON.parse(fs.readFileSync('./settings.json',{encoding: 'utf-8'}));

var restAPI = rally({apiKey: settings.apiKey});
const taskTemplateOPS = require('./taskOPS.json');
const taskTemplateDEV = require('./taskDEV.json');
const WORKSPACE = '/workspace/6582349404';
const PROJECTAPAC = '/project/193018525092';
const PROJECTEU = '/project/193019226808';
let db = new loki('./myRally.json', {autosave: true, autoload:true});

let myApp = angular.module('myRallyTool', []);
myApp.controller('myRallyController', ['$scope', '$http','$rootScope', function($scope, $http, $rootScope) {
	let us = $scope;
	us.userStory = {
		usID: '',
		name: '',
		owner: {},
		scheduleState: 'Backlog',
		crm: '',
		siebel: '',
		displayColor: {},
		iteration: {},
		tag: {},
		owner2: {},
		towner: {},
		purename: '',
		utype: '',
		project: '',
		app: ''
	};

	us.user = [];
	us.proty = [];
	us.tags = [];
	us.itert = [];
	us.utype = ['Backend', 'Frontend', 'Both end'];
	us.selectedOwner = '';
	us.selectedOwner2 = '';
	us.selectedTag = '';
	us.selectedIter = '';
	us.selectedTowner = '';
	us.inputName = '';
	us.selectedColor = '';
	us.result = '';

	// us.tags = fs.readFileSync('./tag.json');
	// console.log(us.tags);
	$http.get('./owner.json').then((response) => {
		us.user = response.data;
	});

	$http.get('./proty.json').then((response) => {
		us.proty = response.data;
	});

	$http.get('./tag.json').then((response) => {
		us.tags = response.data;
	});

	$http.get('./itert.json').then((response) => {
		us.itert = response.data;
	});



	this.convert = (selected, arr, obj) => {
		for (let x of arr) {
			if (selected === x.ref) {
				us.userStory[obj] = x;
			}
		}
	};

	this.dropdownConvert = () => {
		this.convert(us.selectedOwner, us.user, 'owner');
	};

	this.createUS = (us, myCallback) => {
		let project = null;
		let resultID = null;
		let err = {};
		if (us.project == 'EUAM') {
			project = PROJECTEU;
		} else {
			project = PROJECTAPAC;
		}
		restAPI.create({
			type: 'hierarchicalrequirement',
			scope: {
				workspace: WORKSPACE,
				project: project
			},
			data: {
				Name: us.name,
				Owner: {
					_ref: us.owner.ref
				},
				ScheduleState: 'Backlog',
				DisplayColor: us.displayColor.color,
				c_Siebel: us.siebel,
				c_CRM: us.crm,
				Iteration: {
					_ref: us.iteration.ref
				}
			}
		}, (error, result) => {
			if (error) {
				console.log(error);
				err = error;
			} else {
				console.log(result.Object.FormattedID);
				resultID = result.Object.FormattedID;
				console.log('adding tags');
				async.series([(callback) => {
					restAPI.add({
						ref: result.Object._ref,
						collection: 'Tags',
						data: [{
							_ref: us.tag.ref
						}],
					}, callback);
				}, (callback) => {
					let tasks = [];
					if (us.tag.name == 'DEV') {
						tasks = taskTemplateDEV.slice();
					} else {
						tasks = taskTemplateOPS.slice();
					}

					for (var t of tasks) {
						t.Owner = {
							_ref: us.owner.ref
						};
						if (t.Name == 'Functional test') {
							t.Owner = {
								_ref: us.towner.ref
							};
						}
					}
					if (us.utype == 'Both end') {
						tasks = tasks.concat([{
							Name: 'Analyze the US',
							Owner: {
								_ref: us.owner2.ref
							},
							Estimate: '4',
							ToDo: '4',
							Actuals: '4'
						}, {
							Name: 'Coding & Unit Testing',
							Owner: {
								_ref: us.owner2.ref
							},
							Estimate: '4',
							ToDo: '4',
							Actuals: '4'
						}]);
					}
					console.log('adding tasks');
					restAPI.add({
						ref: result.Object,
						collection: 'Tasks',
						data: tasks,
					}, callback);
				}], (error, result) => {
					if (error) {
						console.log(error);
						err = error;
					}
					if (!settings.no_db) {
						this.updateDBUS(us, resultID);
					}
					// return resultID;
					process.nextTick(() => {
						myCallback(err, resultID);
					});
				});
			}
		});
	};
	this.create = () => {
		this.convert(us.selectedOwner2, us.user, 'owner2');
		this.convert(us.selectedTowner, us.user, 'towner');
		this.convert(us.selectedIter, us.itert, 'iteration');
		this.convert(us.selectedTag, us.tags, 'tag');
		this.convert(us.selectedColor, us.proty, 'displayColor');
		if (!us.selectedOwner2) {
			us.userStory.owner2 = {
				name: '',
				email: '',
			}
		}

		us.userStory.name = us.inputName + '-' + us.userStory.crm;
		us.userStory.siebel = us.userStory.crm;
		us.userStory.project = us.userStory.owner.project;
		console.log(us.userStory);
		this.createUS(us.userStory, (err, res) => {
			if (err) {
				// dialog.showMessageBox({detail: `error: ${err.toString()}`});
			}
			$rootScope.usID = res;
			dialog.showMessageBox({detail:`${res} created.`});
			clipboard.writeText(res);
		})
	};

	this.updateDBUS = (us, resID) => {
		try {
			let userCol = db.getCollection('userStory');
			if (userCol === null) {
				userCol = db.addCollection('userStory');
			}
			userCol.insert({
				usID: resID,
				name: us.name,
				crm: us.crm,
				utype: us.utype,
				owner: us.owner.name,
				owner2: us.owner2.name,
				app:us.app,
				status: 'Defined',
				itert: us.iteration.itert,
				towner: us.towner.name,
				priority: us.displayColor.ref,
				project: us.owner.project
			});
			db.saveDatabase();
		} catch(e) {
			// statements
			console.log(e);
		}

	};

}]);

myApp.filter('myFilter', () => {
	return (itert, proj) => {
		let newIt = [];
		for (var i of itert) {
			if (i.project == proj) {
				newIt.push(i);
			}
		}
		return newIt;
	}
});
myApp.directive("limit", [function() {
	return {
		restrict: "A",
		link: function(scope, elem, attrs) {
			var limit = parseInt(attrs.limit);
			angular.element(elem).on("keypress", function(e) {
				if (this.value.length == limit) e.preventDefault();
			});
		}
	}
}]);