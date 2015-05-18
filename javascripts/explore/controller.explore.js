(function () {
	'use strict';

	angular
		.module('oipa.explore')
		.controller('ExploreController', ExploreController);

	ExploreController.$inject = ['$scope', 'Filters'];

	function ExploreController($scope, Filters){
		var vm = this;
		vm.dashboard = 'charts'; // options: charts, geomap, list

		activate();


	    function activate() {
	      
	    }

		$scope.hasOpenFilters = function(){
			return Filters.isOpenedHeader(null);
		}
	}

})();