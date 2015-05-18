/**
* OipaLineChartController
* @namespace oipa.charts.controllers
*/
(function () {
  'use strict';

  angular
    .module('oipa.charts')
    .controller('OipaTableChartController', OipaTableChartController);

  OipaTableChartController.$inject = ['$scope', 'Aggregations'];

  /**
  * @namespace ActivitiesController
  */
  function OipaTableChartController($scope, Aggregations) {

    var vm = this;
    vm.groupBy = $scope.groupBy;
    vm.groupById = $scope.groupById;
    vm.aggregationKey = $scope.aggregationKey;
    vm.aggregationFilters = $scope.aggregationFilters;
    vm.aggregationExtraSelect = $scope.aggregationExtraSelect;
    vm.aggregationExtraSelectIn = $scope.aggregationExtraSelectIn;
    vm.chartData = [];
    vm.unformattedData = []; 

    function activate() {
      vm.loadData();
    }

    vm.loadData = function(){
      Aggregations.aggregation(vm.groupBy, vm.aggregationKey, vm.aggregationFilters).then(succesFn, errorFn);

      function succesFn(data, status, headers, config){
        if(vm.aggregationExtraSelect == 'iati-identifier'){
          vm.unformattedData = data.data;

          var filter__in = [];
          for(var i = 0;i < vm.unformattedData.length;i++){
            filter__in.push(vm.unformattedData[i][vm.groupById]);
          }
          filter__in = filter__in.join();

          if(vm.groupBy = 'transaction-receiver-org'){
            vm.groupBy = 'participating-org';
          }

          Aggregations.aggregation(vm.groupBy, 'iati-identifier', '&'+vm.aggregationExtraSelectIn+'=' + filter__in).then(succesFn, errorFn);
          vm.aggregationExtraSelect = 'iati-identifier-add';
          
        } else if(vm.aggregationExtraSelect == 'iati-identifier-add'){
          var countMap = {};
          for(var i = 0;i < data.data.length;i++){
            countMap[data.data[i][vm.groupById]] = data.data[i]['activity_count'];
          }
          for(var i = 0;i < vm.unformattedData.length;i++){
            vm.unformattedData[i]['activity_count'] = countMap[vm.unformattedData[i][vm.groupById]];
          }

          vm.chartData = vm.reformatData(vm.unformattedData);

        } else {
          if(vm.unformattedData == []){
            vm.chartData = vm.reformatData(data.data);
          } else {
            vm.chartData = vm.reformatData(vm.unformattedData);
          }
        }

      }

      function errorFn(data, status, headers, config){
        console.warn('error getting data');
      }
    }

    vm.reformatData = function(data){
      return data;
    }

    activate();

  }
})();