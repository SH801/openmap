import React, { Component }  from 'react';
import { Bar, Pie } from 'react-chartjs-2';

export class EntityData extends Component {

  getColorPalette = (size) => {
    let basepalette = ["purple", "red", "orange", "yellow", "lime", "green", "blue", "indigo", "violet"];
    let newpalette = [];
    let baseindex = 0;
    for(let i = 0; i < size; i++) {
      newpalette.push(basepalette[baseindex]);
      baseindex++;
      if (baseindex === basepalette.length) baseindex = 0;
    }
    return newpalette;
  }

  convertChartData = (data) => {
    let keys = Object.keys(data);                
    let values = Object.values(data);
    return {
      labels: keys,
      datasets: [{
        data: values,
        backgroundColor: this.getColorPalette(keys.length),
        borderWidth: 1
      }]  
    }
  };

  getOptions = (type, data) => {
    let units = (data.units ? data.units : '');

    return {
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: data.name
        },
        legend: {
          display: (type === 'pie' ? true: false),
          position: 'bottom'
        },
        tooltip: {
          callbacks: {
              label: function(context) { 
                  return ' ' + (type === 'pie' ? context.parsed : context.parsed.y) + ' ' + units;
              }
          }
      },      
  
      }};
  } 

  render() {


    return (
        <div className="accordion-post" style={{ paddingBottom: '20px', height: this.props.data.type === 'pie' ? '300px' : '200px' }}>
            {this.props.data.type === 'bar' ? (
              <Bar data={this.convertChartData(this.props.data.values)} options={this.getOptions('bar', this.props.data)} />
            ): null}
            {this.props.data.type === 'pie' ? (
              <Pie data={this.convertChartData(this.props.data.values)} options={this.getOptions('pie', this.props.data)} />
            ): null}
        </div>
    );
  }
}

export default EntityData;


