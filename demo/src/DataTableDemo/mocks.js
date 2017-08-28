//@flow
import Chance from 'chance';
import times from "lodash/times";
import {DataTableSchema} from '../../../src/flow_types';

const chance = new Chance()
const MOCK_MATERIALS = times(60).map(function (a,index) {
  
  return {
    id: index,
    notDisplayedField: chance.name(),
    name: chance.name(),
    user: {
      lastName: chance.name(),
      status: {
        name: chance.pickone(['pending', 'added'])
      }
    },
    type: 'denicolaType',
    addedBy: chance.name(),
    updatedAt: new Date().toLocaleString(),
    createdAt: new Date().toLocaleString()
  }
})

export const entities = MOCK_MATERIALS;
export const schema: DataTableSchema = {
  model: "material",
  fields: [
    {path: "notDisplayedField", isHidden: true, type: "string", displayName: "Not Displayed" },
    {path: "type", type: "lookup", displayName: "Type" },
    {path: "name", type: "string", displayName: "Name" },
    {path: "createdAt", type: "timestamp", displayName: "Date Created" },
    {path: "updatedAt", type: "timestamp", displayName: "Last Edited" },
    {
      type: 'lookup',
      displayName: "User Status",
      sortDisabled: true,
      path: "user.status.name",
      reference: {
        sourceField: "userId",
        target: "user.id",
        reference: {
          sourceField: "statusId",
          target: "status.id"
        }
      },
    },
    {
      sortDisabled: true,
      path: "user.lastName",
      reference: {
        sourceField: "userId",
        target: "user.id"
      },
      type: "string",
      displayName: "Added By"
    }
  ]
};
