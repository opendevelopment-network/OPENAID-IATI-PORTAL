/**
* CountriesController
* @namespace oipa.countries
*/
(function () {
  'use strict';

  angular
    .module('oipa.sectors')
    .controller('SectorListController', SectorListController);

  SectorListController.$inject = ['$scope', 'Aggregations', 'FilterSelection', 'sectorMapping'];

  /**
  * @namespace SectorListController
  */
  function SectorListController($scope, Aggregations, FilterSelection, sectorMapping) {
    var vm = this;
    vm.filterSelection = FilterSelection;
    vm.sectors = [];
    vm.totalSectors = 0;
    vm.order_by = 'name';
    vm.offset = 0;
    vm.hasToContain = $scope.hasToContain;
    vm.busy = false;
    vm.extraSelectionString = '';
    vm.isCollapsed = false;

    function activate() {
      // use predefined filters or the filter selection
      $scope.$watch("vm.filterSelection.selectionString", function (selectionString, oldString) {
        if(selectionString !== oldString){
          vm.update();
        }
      }, true);

      $scope.$watch("searchValue", function (searchValue, oldSearchValue) {
        if(searchValue == undefined) { vm.update(); return false; }
        searchValue == '' ? vm.extraSelectionString = '' : vm.extraSelectionString = '&name_query='+searchValue;
        vm.update(vm.filterSelection.selectionString);
      }, true);

      // do not prefetch when the list is hidden
      if($scope.shown != undefined){
        $scope.$watch("shown", function (shown) {
          vm.busy = !shown ? true : false;
        }, true);
      }
    }

    vm.hasContains = function(){
      if(vm.hasToContain !== undefined){
        var totalString = vm.filterSelection.selectionString + vm.extraSelectionString;
        if(totalString.indexOf(vm.hasToContain) < 0){
          return false;
        }
      }
      return true;
    }

    vm.update = function(){
      if (!vm.hasContains()) return false;

      vm.offset = 0;
      Aggregations.aggregation('sector', 'disbursement', vm.filterSelection.selectionString + vm.extraSelectionString, vm.order_by, 9999, 0, 'activity_count').then(succesFn, errorFn);

      function replaceDac5(arr){
        var i = arr.length;
        while(i--){
          if(arr[i].hasOwnProperty('children')){
            replaceDac5(arr[i].children);
            if(!arr[i].children.length){
              arr.splice(i, 1);
            }
          } else {
            var match =_.find(vm.remoteSectors, function(sector) {
              return sector.sector_id === arr[i].sector_id;
            })

            if (match) {
              arr[i] = match;
            } else {
              arr.splice(i, 1);
            }
          }
        }
      }

      function updateDisbursements(sector) { 
        if(!sector.hasOwnProperty('children')) {
          return [sector.total_disbursements, sector.activity_count];
        }
        var total_disbursement = 0;
        var activity_count = 0;
        for (var i = 0; i < sector.children.length; i++) {
          var values = updateDisbursements(sector.children[i])
          if (values[0]) total_disbursement += values[0];
          if (values[1]) activity_count += values[1];
          // total_disbursement += updateDisbursements(sector.children[i]) 
        }
        sector.total_disbursements = total_disbursement;
        sector.activity_count = activity_count;
        return [total_disbursement, activity_count]
      }

      function sortSectorChildren(sector, i, reverse) {
        // first level
        if (sector.hasOwnProperty('children')) {
          sector.children = _.sortBy(sector.children, vm.order_by_final)
          if (this) sector.children = sector.children.reverse();
          _.each(sector.children, sortSectorChildren, this);
        }
      }

      function applySectorHierarchy(sectors) {

        // replace lowest level DAC5 in sectormapping with sectors
        replaceDac5(sectors.children);

        _.each(sectors.children, updateDisbursements)

        if (vm.order_by.charAt(0) === "-") { //reverse
          vm.order_by_final = vm.order_by.substring(1);
          sectors = _.sortBy(_.each(sectors.children, sortSectorChildren, true), vm.order_by_final).reverse();
        } else {
          vm.order_by_final = vm.order_by;
          sectors = _.sortBy(_.each(sectors.children, sortSectorChildren), vm.order_by_final)
        }
        return sectors;
      }

      // TODO: called twice, fix
      function succesFn(data, status, headers, config){
          vm.remoteSectors = data.data.results;
          vm.sectorMapping = angular.copy(sectorMapping)
          vm.sectors = applySectorHierarchy(vm.sectorMapping);
          vm.totalSectors = data.data.count;
          $scope.count = vm.totalSectors;
      }

      function errorFn(data, status, headers, config){
        console.warn('error getting data for sector.block');
      }
    }

    vm.toggleHideChildren = function($event) {
      var parent = $($event.target).closest('.parent') 
      var children = parent.next();

      //children.toggle()
      parent.toggleClass('expanded').toggleClass('collapsed')

    }

    vm.toggleOrder = function(){
      vm.update(vm.filterSelection.selectionString);
    }
    

    activate();
  }
})();