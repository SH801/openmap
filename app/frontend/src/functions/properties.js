import { PROPERTY_ENTITYTYPE, PROPERTY_ACTION } from "../constants";

export const getEntityBusinessTypes = (entity) => {
  // Add in business type properties to businesstypes array
  const businesstypes = [];
  if (entity.properties !== undefined) {
    for(let i = 0; i < entity.properties.length; i++) {
      if (entity.properties[i].type === PROPERTY_ENTITYTYPE) {
        businesstypes.push(entity.properties[i]);
      }
    }
  }
  return businesstypes;
}

export const getEntityActions = (entity) => {
    // Add in action properties to actions array
    const actions = [];
    if (entity.properties !== undefined) {
      for(let i = 0; i < entity.properties.length; i++) {
        if (entity.properties[i].type === PROPERTY_ACTION) {
          actions.push(entity.properties[i]);
        }
      }
    }
    return actions;
}

export const getBusinessTypes = (properties) => {
  // Add in business type properties to businesstypes array
  const businesstypes = [];
  if (properties !== undefined) {
    for(let i = 0; i < properties.length; i++) {
      if (properties[i].type === PROPERTY_ENTITYTYPE) {
        businesstypes.push(properties[i]);
      }
    }
  }
  return businesstypes;
}

export const getActions = (properties) => {
    // Add in action properties to actions array
    const actions = [];
    if (properties !== undefined) {
      for(let i = 0; i < properties.length; i++) {
        if (properties[i].type === PROPERTY_ACTION) {
          actions.push(properties[i]);
        }
      }
    }
    return actions;
}

export const getIDs = (properties) => {
  const ids = [];
  for(let i = 0; i < properties.length; i++) {
    ids.push(properties[i]['id']);
  }
  return ids;
}