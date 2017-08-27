//@flow
import { withRouter } from "react-router-dom";
import { Fields, reduxForm } from "redux-form";
import { compose } from "redux";
import { isEmpty, range, forEach } from "lodash";
import "../toastr";
import React from "react";
import moment from "moment";
import PagingTool from "./PagingTool";
import camelCase from "lodash/camelCase";
import { onEnterHelper } from "../utils/handlerHelpers";
import FilterAndSortMenu from "./FilterAndSortMenu";

import {
  Button,
  Menu,
  InputGroup,
  Spinner,
  Popover,
  Classes,
  Position,
  ContextMenu,
  Checkbox
} from "@blueprintjs/core";
import ReactTable from "react-table";

import "./style.css";
const noop = () => {};
class ReactDataTable extends React.Component {
  state = {
    columns: []
  };

  static defaultProps = {
    entities: [],
    withTitle: true,
    withSearch: true,
    withPaging: true,
    pageSize: 10,
    extraClasses: "",
    page: 1,
    height: "100%",
    reduxFormSearchInput: {},
    reduxFormSelectedEntityIdMap: {},
    isLoading: false,
    isInfinite: false,
    withCheckboxes: false,
    setSearchTerm: noop,
    setFilter: noop,
    clearFilters: noop,
    setPageSize: noop,
    setOrder: noop,
    setPage: noop,
    onDoubleClick: noop
  };

  componentWillMount() {
    const { schema = {} } = this.props;
    const columns = schema.fields
      ? schema.fields.reduce((columns, field, schemaIndex) => {
          return field.isHidden
            ? columns
            : columns.concat({
                displayName: field.displayName,
                schemaIndex
              });
        }, [])
      : [];
    this.setState({ columns });
  }

  render() {
    const {
      entities,
      extraClasses,
      tableName,
      isLoading,
      searchTerm,
      entityCount,
      setSearchTerm,
      clearFilters,
      setPageSize,
      setPage,
      withTitle,
      withSearch,
      withPaging,
      isInfinite,
      onRefresh,
      page,
      height,
      pageSize,
      reduxFormSearchInput,
      reduxFormSelectedEntityIdMap,
      selectedFilter
    } = this.props;

    const hasFilters = selectedFilter || searchTerm;
    const numRows = isInfinite ? entities.length : pageSize;
    const maybeSpinner = isLoading
      ? <Spinner className={Classes.SMALL} />
      : undefined;

    const selectedRowCount = Object.keys(
      reduxFormSelectedEntityIdMap.input.value || {}
    ).length;

    return (
      <div
        style={{ height }}
        className={"data-table-container " + extraClasses}
      >
        <div className={"data-table-header"}>
          <div className={"data-table-title-and-buttons"}>
            {tableName &&
              withTitle &&
              <span className={"data-table-title"}>
                {tableName}
              </span>}

            {this.props.children}
          </div>
          {withSearch &&
            <div className={"data-table-search-and-clear-filter-container"}>
              {hasFilters
                ? <Button
                    className={"data-table-clear-filters"}
                    onClick={() => {
                      clearFilters();
                    }}
                    text={"Clear filters"}
                  />
                : ""}
              <SearchBar
                {...{
                  reduxFormSearchInput,
                  setSearchTerm,
                  maybeSpinner
                }}
              />
            </div>}
        </div>
        <div className={"data-table-body"}>
          <ReactTable
            data={entities}
            columns={this.getColumns()}
            defaultPageSize={numRows}
            showPagination={false}
            sortable={false}
            className={"-striped"}
            getTrGroupProps={this.getTableRowProps}
          />
        </div>
        <div className={"data-table-footer"}>
          <div className={"tg-react-table-selected-count"}>
            {selectedRowCount > 0
              ? ` ${selectedRowCount} Record${selectedRowCount === 1
                  ? ""
                  : "s"} Selected `
              : ""}
          </div>
          {!isInfinite && withPaging
            ? <PagingTool
                paging={{
                  total: entityCount,
                  page,
                  pageSize
                }}
                onRefresh={onRefresh}
                setPage={setPage}
                setPageSize={setPageSize}
              />
            : <div className={"tg-placeholder"} />}
        </div>
      </div>
    );
  }

  getTableRowProps = (state, rowInfo) => {
    const {
      reduxFormSelectedEntityIdMap,
      withCheckboxes,
      onDoubleClick,
      history
    } = this.props;
    if (!rowInfo) return {};
    const rowId = rowInfo.original.id;
    const rowSelected = reduxFormSelectedEntityIdMap.input.value[rowId];
    return {
      onClick: e => {
        if (withCheckboxes) return;
        this.handleRowClick(e, rowInfo);
      },
      onContextMenu: e => {
        e.preventDefault();
        if (rowId === undefined) return;
        const oldIdMap = reduxFormSelectedEntityIdMap.input.value || {};
        let newIdMap;
        if (withCheckboxes) {
          newIdMap = oldIdMap;
        } else {
          // if we are not using checkboxes we need to make sure
          // that the id of the record gets added to the id map
          newIdMap = oldIdMap[rowId] ? oldIdMap : { [rowId]: true };
          reduxFormSelectedEntityIdMap.input.onChange(newIdMap);
        }
        this.showContextMenu(newIdMap, e);
      },
      className: rowSelected && !withCheckboxes ? "selected" : "",
      onDoubleClick: () => {
        onDoubleClick(rowInfo.original, rowInfo.index, history);
      }
    };
  };

  renderCheckboxHeader = () => {
    const { entities, reduxFormSelectedEntityIdMap } = this.props;
    const checkedRows = getSelectedRowsFromEntities(
      entities,
      reduxFormSelectedEntityIdMap.input.value
    );
    const checkboxProps = {
      checked: false,
      indeterminate: false
    };
    if (checkedRows.length === entities.length) {
      //tnr: maybe this will need to change if we want enable select all across pages
      checkboxProps.checked = true;
    } else {
      if (checkedRows.length) {
        checkboxProps.indeterminate = true;
      }
    }

    return (
      <div>
        <Checkbox
          onChange={() => {
            const newIdMap = reduxFormSelectedEntityIdMap.input.value || {};
            range(entities.length).forEach(i => {
              if (checkboxProps.checked) {
                delete newIdMap[entities[i].id];
              } else {
                newIdMap[entities[i].id] = true;
              }
            });

            reduxFormSelectedEntityIdMap.input.onChange(newIdMap);
            this.setState({ lastCheckedRow: undefined });
          }}
          {...checkboxProps}
          className={"tg-react-table-checkbox-cell-inner"}
        />
      </div>
    );
  };

  renderCheckboxCell = row => {
    const rowIndex = row.index;
    const { entities, reduxFormSelectedEntityIdMap } = this.props;
    const checkedRows = getSelectedRowsFromEntities(
      entities,
      reduxFormSelectedEntityIdMap.input.value
    );
    const { lastCheckedRow } = this.state;

    const isSelected = checkedRows.some(rowNum => {
      return rowNum === rowIndex;
    });
    if (rowIndex >= entities.length) {
      return <div />;
    }
    const entity = entities[rowIndex];
    return (
      <div className={"tg-react-table-checkbox-cell"} style={{ width: 40 }}>
        <Checkbox
          onClick={e => {
            let newIdMap = reduxFormSelectedEntityIdMap.input.value || {};
            const isRowCurrentlyChecked = checkedRows.indexOf(rowIndex) > -1;

            if (e.shiftKey && rowIndex !== lastCheckedRow) {
              const start = rowIndex;
              const end = lastCheckedRow;
              for (
                let i = Math.min(start, end);
                i < Math.max(start, end) + 1;
                i++
              ) {
                const isLastCheckedRowCurrentlyChecked =
                  checkedRows.indexOf(lastCheckedRow) > -1;
                let tempEntity = entities[i];
                if (isLastCheckedRowCurrentlyChecked) {
                  newIdMap[tempEntity.id] = true;
                } else {
                  delete newIdMap[tempEntity.id];
                }
              }
            } else {
              //no shift key
              if (isRowCurrentlyChecked) {
                delete newIdMap[entity.id];
              } else {
                newIdMap[entity.id] = true;
              }
            }

            reduxFormSelectedEntityIdMap.input.onChange(newIdMap);
            this.setState({ lastCheckedRow: rowIndex });
          }}
          className={"tg-react-table-checkbox-cell-inner"}
          checked={isSelected}
        />
      </div>
    );
  };

  getColumns = () => {
    const { schema, cellRenderer, withCheckboxes } = this.props;
    const { columns } = this.state;
    if (!columns.length) {
      return;
    }
    let columnsToRender = withCheckboxes
      ? [
          {
            Header: this.renderCheckboxHeader,
            Cell: this.renderCheckboxCell,
            width: 35,
            resizable: false,
            getHeaderProps: () => {
              return {
                className: "tg-react-table-checkbox-header-container"
              };
            },
            getProps: () => {
              return {
                className: "tg-react-table-checkbox-cell-container"
              };
            }
          }
        ]
      : [];
    columns.forEach(column => {
      const schemaForColumn = schema.fields[column.schemaIndex];
      const tableColumn = {
        Header: this.renderColumnHeader(column.schemaIndex),
        accessor: schemaForColumn.path
      };
      if (schemaForColumn.type === "timestamp") {
        tableColumn.Cell = props =>
          <span>
            {moment(new Date(props.value)).format("MMM D, YYYY")}
          </span>;
      } else if (schemaForColumn.type === "boolean") {
        tableColumn.Cell = props =>
          <span>
            {props.value ? "True" : "False"}
          </span>;
      }
      if (cellRenderer && cellRenderer[schemaForColumn.path]) {
        tableColumn.Cell = props =>
          <span>
            {cellRenderer[schemaForColumn.path](props)}
          </span>;
      }
      columnsToRender.push(tableColumn);
    });
    return columnsToRender;
  };

  handleRowClick = (e, rowInfo) => {
    const rowId = rowInfo.original.id;
    const {
      reduxFormSelectedEntityIdMap,
      entities,
      onDeselect,
      onSingleRowSelect,
      onMultiRowSelect
    } = this.props;
    if (rowId === undefined) return;
    const ctrl = e.metaKey || e.ctrlKey;
    const oldIdMap = reduxFormSelectedEntityIdMap.input.value || {};
    const rowSelected = oldIdMap[rowId];
    let newIdMap = {
      [rowId]: new Date()
    };
    if (rowSelected && e.shiftKey) return;
    else if (rowSelected && ctrl) {
      newIdMap = {
        ...oldIdMap
      };
      delete newIdMap[rowId];
    } else if (rowSelected) {
      newIdMap = {};
    } else if (ctrl) {
      newIdMap = {
        ...oldIdMap,
        ...newIdMap
      };
    } else if (e.shiftKey && !isEmpty(oldIdMap)) {
      newIdMap = {
        [rowId]: true
      };
      const currentlySelectedRowIndices = getSelectedRowsFromEntities(
        entities,
        oldIdMap
      );
      if (currentlySelectedRowIndices.length) {
        // const minIndex = min(currentlySelectedRowIndices);
        // const maxIndex = max(currentlySelectedRowIndices);
        // if (rowInfo.index < minIndex || rowInfo.index > maxIndex) {
        //   if (
        //     rowInfo.index === minIndex - 1 ||
        //     rowInfo.index === maxIndex + 1
        //   ) {
        //     newIdMap = {
        //       ...oldIdMap,
        //       ...newIdMap
        //     };
        //   } else {
        //     const highRange =
        //       rowInfo.index < minIndex ? minIndex : rowInfo.index;
        //     const lowRange =
        //       rowInfo.index < minIndex ? rowInfo.index : maxIndex;
        //     range(lowRange, highRange).forEach(index => {
        //       const recordId = entities[index] && entities[index].id;
        //       if (recordId || recordId === 0) newIdMap[recordId] = true;
        //     });
        //     newIdMap = {
        //       ...oldIdMap,
        //       ...newIdMap
        //     };
        //   }
        // } else {
        let timeToBeat = {
          id: null,
          time: null
        };
        forEach(oldIdMap, (value, key) => {
          if (typeof value !== "boolean" && value > timeToBeat.time)
            timeToBeat = {
              id: parseInt(key, 10),
              time: value
            };
        });
        const mostRecentlySelectedIndex = entities.findIndex(
          e => e.id === timeToBeat.id
        );
        if (mostRecentlySelectedIndex !== -1) {
          const highRange =
            rowInfo.index < mostRecentlySelectedIndex
              ? mostRecentlySelectedIndex - 1
              : rowInfo.index;
          const lowRange =
            rowInfo.index > mostRecentlySelectedIndex
              ? mostRecentlySelectedIndex + 1
              : rowInfo.index;
          range(lowRange, highRange).forEach(index => {
            const recordId = entities[index] && entities[index].id;
            if (recordId || recordId === 0) newIdMap[recordId] = true;
          });
          newIdMap = {
            ...oldIdMap,
            ...newIdMap
          };
        }
        // }
      }
    }

    reduxFormSelectedEntityIdMap.input.onChange(newIdMap);
    const selectedRecords = getSelectedRecordsFromEntities(entities, newIdMap);
    selectedRecords.length === 0
      ? onDeselect()
      : selectedRecords.length > 1
        ? onMultiRowSelect(selectedRecords)
        : onSingleRowSelect(selectedRecords[0]);
  };

  showContextMenu = (idMap, e) => {
    const { entities, history, contextMenu } = this.props;
    const selectedRecords = entities.reduce((acc, entity) => {
      return idMap[entity.id] ? acc.concat(entity) : acc;
    }, []);
    const itemsToRender = contextMenu({
      selectedRecords,
      history
    });
    if (!itemsToRender) return null;
    const menu = (
      <Menu>
        {itemsToRender}
      </Menu>
    );
    ContextMenu.show(menu, { left: e.clientX, top: e.clientY });
  };

  renderColumnHeader = columnIndex => {
    const { schema, setFilter, setOrder, order, filterOn } = this.props;
    const { columns } = this.state;
    const column = columns[columnIndex];
    const schemaIndex = column["schemaIndex"];
    const schemaForField = schema.fields[schemaIndex];
    const { displayName, sortDisabled } = schemaForField;
    const columnDataType = schemaForField.type;
    const ccDisplayName = camelCase(displayName);
    const activeFilterClass =
      filterOn === ccDisplayName ? " tg-active-filter" : "";
    let ordering;

    if (order && order.length) {
      order.forEach(order => {
        const orderField = order.replace("-", "");
        if (orderField === ccDisplayName) {
          if (orderField === order) {
            ordering = "asc";
          } else {
            ordering = "desc";
          }
        }
      });
    }

    const isOrderedDown = ordering && ordering === "asc";
    // const menu = this.renderMenu(columnDataType, schemaForField);
    return (
      <div className={"tg-react-table-column-header"}>
        <span title={displayName} className={"tg-react-table-name"}>
          {displayName + "  "}
        </span>
        {!sortDisabled &&
          <div className={"tg-sort-arrow-container"}>
            <span
              title={"Sort Z-A"}
              onClick={() => {
                setOrder("reverse:" + ccDisplayName);
              }}
              className={
                "pt-icon-standard pt-icon-chevron-up " +
                (ordering && !isOrderedDown ? "tg-active-sort" : "")
              }
            />
            <span
              title={"Sort A-Z"}
              onClick={() => {
                setOrder(ccDisplayName);
              }}
              className={
                "pt-icon-standard pt-icon-chevron-down " +
                (ordering && isOrderedDown ? "tg-active-sort" : "")
              }
            />
          </div>}
        <Popover position={Position.BOTTOM_RIGHT}>
          <Button
            title={"Filter"}
            className={
              "tg-filter-menu-button " + Classes.MINIMAL + activeFilterClass
            }
            iconName="filter"
          />
          <FilterAndSortMenu
            setFilter={setFilter}
            filterOn={ccDisplayName}
            dataType={columnDataType}
            schemaForField={schemaForField}
          />
        </Popover>
      </div>
    );
  };
}

function SearchBar({ reduxFormSearchInput, setSearchTerm, maybeSpinner }) {
  return (
    <InputGroup
      className={"pt-round datatable-search-input"}
      placeholder="Search..."
      {...reduxFormSearchInput.input}
      {...onEnterHelper(() => {
        setSearchTerm(reduxFormSearchInput.input.value);
      })}
      rightElement={
        maybeSpinner ||
        <Button
          className={Classes.MINIMAL}
          iconName={"pt-icon-search"}
          onClick={() => {
            setSearchTerm(reduxFormSearchInput.input.value);
          }}
        />
      }
    />
  );
}

export default compose(
  withRouter,
  reduxForm({ form: "tgReactTable" })
)(props => {
  return (
    <Fields
      names={[
        "reduxFormQueryParams",
        "reduxFormSearchInput",
        "reduxFormSelectedEntityIdMap"
      ]}
      {...props}
      component={ReactDataTable}
    />
  );
});

function getSelectedRowsFromEntities(entities, idMap) {
  if (!idMap) return [];
  return entities.reduce((acc, entity, i) => {
    return idMap[entity.id] ? acc.concat(i) : acc;
  }, []);
}

function getSelectedRecordsFromEntities(entities, idMap) {
  if (!idMap) return [];
  return entities.reduce((acc, entity) => {
    return idMap[entity.id] ? acc.concat(entity) : acc;
  }, []);
}
