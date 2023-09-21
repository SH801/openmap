import React, { Component } from "react";
import { getEntityActions } from  "../../../../../../../functions/properties"
import DataAccordion from "./DataAccordion/DataAccordion";
import EntityActionsList from "./BottomViews/EntityActions/EntityActionsList";
import EntityPostsList from "./BottomViews/EntityPosts/EntityPostsList";
import EntityDataList from "./BottomViews/EntityData/EntityDataList";

export class EntityRelated extends Component {

  render () {
    return (
      <div className="accordion-list">
        <EntityActionsList 
          actions={getEntityActions(this.props.entity)} 
          singlerow={false} 
          selectProperty={this.props.selectProperty}
        />
        {this.props.entity.posts ? (
          <>
          {this.props.entity.posts.length > 0 ? (
            <DataAccordion
              title={this.props.entity.posts.length === 1 ? "post" : "posts"}
              titleData={this.props.entity.posts.length}
              bottomView={<EntityPostsList posts={this.props.entity.posts} />}
            />
          ) : null}
          </>
        ) : null}
        {this.props.entity.data ? (
          <>
          {this.props.entity.data.length > 0 ? (
            <DataAccordion
              title={this.props.entity.data.length === 1 ? "dataset" : "datasets"}
              titleData={this.props.entity.data.length}
              bottomView={<EntityDataList data={this.props.entity.data} />}
            />
          ) : null}
          </>
        ) : null}
      </div>
    );
  }
};

export default EntityRelated;
