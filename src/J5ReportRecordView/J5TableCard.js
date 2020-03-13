import React from "react";
import { Button } from "@blueprintjs/core";
import { camelCase, noop, get, identity } from "lodash";
import { compose, withProps, branch } from "recompose";
import CollapsibleCard from "../CollapsibleCard";
import InfoHelper from "../InfoHelper";
import DataTable from "../DataTable";
import withTableParams from "../DataTable/utils/withTableParams";
import withQueryDynamic from "../enhancers/withQueryDynamic";

function J5TableCard({
  title,
  formName,
  helperMessage,
  entities: maybeEntities, // directly passed, not remote paging
  tableProps,
  schema,
  showLinkModal,
  onDoubleClick,
  isLinkable,
  cellRenderer,
  openTitleElements,
  linkButtonText,
  children,
  tableParams = {},
  createSchema = noop,
  processData = identity,
  fragment,
  SubComponent
}) {
  let entities = maybeEntities;
  // using remote paging
  if (fragment) {
    entities = tableParams.entities;
  }
  entities = entities || [];
  const filteredEntities = processData(entities);

  return (
    <CollapsibleCard
      icon={helperMessage && <InfoHelper>{helperMessage}</InfoHelper>}
      title={title}
      key={title + (filteredEntities.length > 0 ? "_nonempty" : "")} // force remount on data arrival
      initialClosed={!filteredEntities.length}
      openTitleElements={[
        isLinkable && (
          <Button key="linkButton" onClick={() => showLinkModal()}>
            {linkButtonText || `Link ${title}`}
          </Button>
        ),
        ...openTitleElements
      ]}
    >
      <DataTable
        {...tableProps}
        SubComponent={SubComponent || null}
        onDoubleClick={onDoubleClick}
        formName={formName} //because these tables are currently not connected to table params, we need to manually pass a formName here
        cellRenderer={cellRenderer}
        {...tableParams}
        entities={filteredEntities}
        // schema is weird because we are sometimes generating schema off of the entities
        schema={createSchema(entities) || tableParams.schema || schema}
      />
      {children}
    </CollapsibleCard>
  );
}

export default compose(
  withProps(props => {
    const {
      fragment,
      title,
      schema: maybeSchema,
      j5ReportId,
      columnToSortBy
    } = props;
    const formName =
      (window.frontEndConfig.tgModuleName || "") + "-" + camelCase(title);

    if (!fragment) {
      return {
        formName
      };
    }
    const modelName = get(fragment, "definitions[0].typeCondition.name.value");
    let schema = maybeSchema;
    if (schema && !schema.model) {
      if (Array.isArray(schema))
        schema = {
          fields: schema
        };
      schema.model = modelName;
    }
    // this happens when we are creating the schema based on the entities
    if (!schema) {
      schema = {
        model: modelName,
        fields: []
      };
    }

    const defaults = columnToSortBy
      ? {
          order: [columnToSortBy]
        }
      : {};

    return {
      schema,
      formName,
      runTimeQueryOptions: {
        fragment,
        options: {
          variables: {
            filter: {
              j5ReportId
            }
          }
        }
      },
      ...defaults
    };
  }),
  branch(
    props => props.runTimeQueryOptions,
    compose(
      withTableParams({
        urlConnected: false,
        withDisplayOptions: true
      }),
      withQueryDynamic({
        isPlural: true
      })
    )
  )
)(J5TableCard);
