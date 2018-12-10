    // let section = d3.select("#economy");
    // let article = d3.select("#income_poverty");
    
    let parseTime = d3.timeParse("%d/%m/%Y"),
        formatTime = d3.timeFormat("%d/%m/%Y"),
        formatYear = d3.timeFormat("%Y"),
        parseYear = d3.timeParse("%Y"),
        nut3regions = [
        "Dublin",
        "Ireland",
        ],
        qnq22CSV = "../data/Economy/QNQ22_employment.csv",
        annual ="../data/Economy/annualemploymentchanges.csv",
        qnq22JSON = "../data/Economy/QNQ22.json",
        pageSize = 12;
        // qnqJSON = trooms;
        // qnq22_keys = Object.keys(qnqJSON[0]);
        // qnqJSON.push()
        

    /*** This employment Chart ***/
    Promise.all([
        d3.csv(qnq22CSV),
        d3.csv(annual),

    ]).then(datafiles => {
        const QNQ22 = datafiles[0],
            annual = datafiles[1],
            // QNQ22JSON = datafiles[2],
            columnNames = QNQ22.columns.slice(2),
            groupBy = QNQ22.columns[1];

        const columnNamesB = annual.columns.slice(2),
        groupByB = annual.columns[0];
    
        const valueData = QNQ22.map( d => {
            d.label = d.quarter;
            d.date = convertQuarter(d.quarter);
            for(var i = 0, n = columnNames.length; i < n; ++i){
                d[columnNames[i]] = +d[columnNames[i]]; 
            }
            d.quarter = qToQuarter(d.quarter);
            return d;
        });

        const valueDataB = annual.map( d => {
            d.label = d.date;
            d.date = parseYear(d.date);
            for(var i = 0, n = columnNamesB.length; i < n; ++i){
                d[columnNamesB[i]] = +d[columnNamesB[i]]; 
            }
            return d;
        });

        const types = d3.nest()
            .key( regions => { return regions[groupBy];})
            .entries(valueData);
        
        const typesB = d3.nest()
            .key( regions => { return regions[groupByB];})
            .entries(valueDataB);
        

        const grouping = types.map(region => region.key);


        const employmentContent = {
            element: "#chart-employment",
            keys: grouping,
            data: types
        };

        const mlineChart = new MultiLineChart(employmentContent);
              mlineChart.getData(columnNames[0]);
              mlineChart.addTooltip("Employment Quarterly Count - ", "thousands", "quarter");

        d3.select(".employment_count").on("click", function(){
            $(this).siblings().removeClass('active');
            $(this).addClass('active');
            mlineChart.data = types;
            mlineChart.getData(columnNames[0],"Quarters", "Thousands", "thousands");
            mlineChart.addTooltip("", "thousands", "quarter")
            mlineChart.hideRate(false);
        });

        d3.select(".employment_arate").on("click", function(){
            $(this).siblings().removeClass('active');
            $(this).addClass('active');
            mlineChart.data = typesB;
            mlineChart.getData(columnNamesB[0], "Years", "%","percentage");
            mlineChart.addTooltip("Year:", "percentage", "year")
            mlineChart.hideRate(true);
        });

        // d3.select(window).on("resize", function(){
        //     mlineChart.init(); 
        //     mlineChart.getData(columnNames[0], types);
        //     mlineChart.addTooltip("", "thousands", "quarter");
        // });
    
    })
    .catch(function(error){
        console.log(error);
        });

    /*** This unemployment Chart ***/
    d3.csv("../data/Economy/QNQ22_2.csv").then(data => {

        let keys = data.columns.slice(3),
            selector = "Unemployed Persons aged 15 years and over (Thousand)";
        
        const dataSet = dataSets(data, keys);

        dataSet.forEach(d => {
            let date = parseTime(d.date);
            d.label = d.quarter;
            d.date = parseTime(d.date);
            d.years = formatYear(date);
        });

        const testData = filterbyDate(dataSet, "date", "Jan 01  2006");

        //nestData(data, date, name, valueName)
        let newData = nestData(testData, "label", "region" , selector),
            size = newData.length/pageSize;

            console.log((testData));

        const grouping = ["Dublin", "Ireland"]; // use the key function to generate this array

        const employmentCharts = new StackedAreaChart("#chartNew", "Quarters", "Thousands", "date", grouping);
        employmentCharts.tickNumber = 24;
        employmentCharts.pagination(newData, "#chartNew", 24, 2, "years", "Thousands - Quarter:");

        d3.select(window).on("resize", function(){
            employmentCharts.init(); 
            employmentCharts.pagination(newData, "#chartNew", 12, 3, "label", "Thousands - Quarter:");
        });
        
        })// catch any error and log to console
        .catch(function(error){
        console.log(error);
        });


    /*** This the Gross Value Added per Capita at Basic Prices Chart ***/
    d3.csv("../data/Economy/RAA01.csv").then( data => {

        let columnNames = data.columns.slice(1);
        let incomeData = data;
            incomeData.forEach( d => {
                d.label = d.date;
                d.date = parseYear(d.date);
                d.value = +d.value;
            })
        console.log("GVA data", incomeData);

        // const IncomeGroupedBar = new StackBarChart("#chart-gva", incomeData, columnNames, "€", "Years");
        //     IncomeGroupedBar.addTooltip("Gross Value Added - Year:", "thousands", "date");
    
    })
    .catch(function(error){
        console.log(error);
    });


    /*** This Survey on Income and Living Conditions for Dublin Charts ***/
    d3.csv("../data/Economy/SIA20.csv").then( data => {

        let columnNames = data.columns.slice(2);
        
        let incomeData = data;
            console.log("values percent",incomeData);

            incomeData.forEach( d => {
                columnNames.forEach( k => {
                    d[k] = (+d[k])/100;
                })
            })

        const IncomeGroupedBar = new StackBarChart("#chart-poverty-rate", incomeData, columnNames, "%", "Survey on Income and Living Conditions for Dublin");
              IncomeGroupedBar.addTooltip("Poverty Rating - Year:", "percentage", "date");
        
    
    })
    .catch(function(error){
        console.log(error);
    });

    // load csv data and turn value into a number
    d3.csv("../data/Economy/IncomeAndLivingData.csv").then( data => {   
        var keys = data.columns;
        
        // console.log(keys);

        // blank array
        var transposedData = [];
        data.forEach(d => {
            for (var key in d) {
                // console.log(key);
                var obj = {};
                if (!(key === "type" || key === "region")){
                obj.type = d.type;
                obj.region = d.region;
                obj.year = key;
                obj.value = +d[key];
                transposedData.push(obj);
            }}
        });

        newList = d3.nest()
            .key(d => { return d.region })
            .key(d => { return d.type })
            .entries(transposedData);

        let dataFiltered = newList.find( d => d.key === "Dublin").values.find(
                d => d.key === "Median Real Household Disposable Income (Euro)"
            ).values;

        const disosableIncomeChart = new BarChart( dataFiltered, "#chart-disposable-income", "year", "value", "Years", "€");
        
    })
    // catch any error and log to console
    .catch(function(error){
    console.log(error);
    });

    // load csv data and turn value into a number
    d3.csv("../data/Economy/IncomeAndLivingData.csv").then( data => {   
        let columnNames = data.columns.slice(2),
            employeesSizeData = data;

    })
    // catch any error and log to console
    .catch(function(error){
    console.log(error);
    });

    // /*** Industry Sectors Charts here ***/
    // //#chart-employment-sector
    // d3.csv("../data/Economy/QNQ40.csv").then( data => { 

    //     let columnNames = data.columns.slice(2);

    //     data.forEach(d => {
    //         for(var i = 0, n = columnNames.length; i < n; ++i){
    //             d[columnNames[i]] = +d[columnNames[i]] || 0;
    //             d.date = d.quarter;
    //         }
    //         return d;
    //     });

    //     // const employeesBySectorChart = new MultiLineChart(nestData, "#chart-employment-sector", "Quarters", "Persons (000s)", "xValue", grouping);
    //     const newTest = new StackBarChart("#chart-employment-sector", data, columnNames, "Persons (000s)", "Quarters");
    //     newTest.addTooltip("Poverty Rating Year:", "percentage", "date");
        
    // })
    // // catch any error and log to console
    // .catch(function(error){
    // console.log(error);
    // });
    
    //#chart-employees-by-size
    // load csv data and turn value into a number
    d3.csv("../data/Economy/BRA08.csv").then( data => { 

        let columnNames = data.columns.slice(3),
        xValue = data.columns[0];

        data.forEach(d => {
            for(var i = 0, n = columnNames.length; i < n; ++i){

                d[columnNames[i]] = +d[columnNames[i]];
                d.label = d.date;
                d.date = parseYear(d.date);
            }
            return d;
        });

        const employeesBySizeData = data;
        
        let nestData = d3.nest()
            .key( d =>{ return d.type;})
            .entries(employeesBySizeData);

        let grouping = nestData.map(d => d.key);

        const employeesBySize = {
            element: "#chart-employees-by-size",
            keys: grouping,
            data: nestData
        };
        
        const employeesBySizeChart = new MultiLineChart(employeesBySize);
              employeesBySizeChart.getData("value");
              employeesBySizeChart.addTooltip("Year:", "thousands", "year");
    })
    // catch any error and log to console
    .catch(function(error){
    console.log(error);
    });
    

    //#chart-overseas-vistors
        // load csv data and turn value into a number
        d3.csv("../data/Economy/overseasvisitors.csv").then( data => { 

            let columnNames = data.columns.slice(1),
                xValue = data.columns[0];

                data.forEach(d => {
                    for(var i = 0, n = columnNames.length; i < n; ++i){
                        d[columnNames[i]] = +d[columnNames[i]];
                    }
                    return d;
                });

            let overseasVisitorsData = data;
        
            const overseasvisitorsChart = new GroupedBarChart(overseasVisitorsData, columnNames, xValue, "#chart-overseas-vistors", "grouped bar chart", "Millions");
                  overseasvisitorsChart.addTooltip("Oversea Vistors (Millions) - Year", "thousands", xValue);
        
        // console.log("this is a random test of the grouped bar chart", newDatatest);
        
        })
        // catch any error and log to console
        .catch(function(error){
        console.log(error);
        });


function join(lookupTable, mainTable, lookupKey, mainKey, select) {
    
    var l = lookupTable.length,
        m = mainTable.length,
        lookupIndex = [],
        output = [];
    
    for (var i = 0; i < l; i++) { // loop through the lookup array
        var row = lookupTable[i];
        lookupIndex[row[lookupKey]] = row; // create a index for lookup table
    }
    
    for (var j = 0; j < m; j++) { // loop through m items
        var y = mainTable[j];
        var x = lookupIndex[y[mainKey]]; // get corresponding row from lookupTable
        output.push(select(y, x)); // select only the columns you need
    }
    
    return output;
}

function dataSets (data, columns){
    coercedData = data.map( d => {
        for( var i = 0, n = columns.length; i < n; i++ ){
            d[columns[i]] = d[columns[i]] !== "null" ? +d[columns[i]] : "unavailable";
        }
    return d;
    });
    return coercedData;
}

function convertQuarter(q){
    let splitted = q.split('Q');
    let year = splitted[0];
    let quarterEndMonth = splitted[1] * 3 - 2;
    let date = d3.timeParse('%m %Y')(quarterEndMonth + ' ' + year);
    return date;
}

function qToQuarter(q){
    let splitted = q.split('Q');
    let year = splitted[0];
    let quarter = splitted[1];
    let quarterString = (year + " Quarter "+ quarter);
    return quarterString;
}

// function dataSets (data, columns){
//     coercedData = data.map( d => {
//         for( var i = 0, n = columns.length; i < n; i++ ){
//             d[columns[i]] = +d[columns[i]];
//         }
//     return d;
//     });
//     return coercedData;
// }

function  nestData(data, date, name, value){
    let nested_data = d3.nest()
        .key(function(d) { return d[date]; })
        .entries(data); // its the string not the date obj

    let mqpdata = nested_data.map(function(d){
        let obj = {
            label: d.key
        }
            d.values.forEach(function(v){
            obj[v[name]] = v[value];
            obj.date = v.date;
            obj.years = v.years;
        })
        return obj;
    })

  return mqpdata;
}

function filterByDateRange(data, dateField, dateOne, dateTwo){
    return data.filter( d => {
        return d[dateField] >= new Date(dateOne) && d[dateField] <= new Date(dateTwo);
    });
}

function filterbyDate(data, dateField, date){
    return data.filter( d => {
        return d[dateField] >= new Date(date);
    });
}
