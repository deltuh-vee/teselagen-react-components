//@flow
import React from "react";
import { ReactTable } from "../../../src";
import { entities } from "./new_schema_mocks";
import { MenuItem, Switch } from "@blueprintjs/core";

export default class DataTableWrapper extends React.Component {
	state={
		withTitle: true,
		withSearch: true,
		withPaging: true,
		isInfinite: false,
		isLoading: false,
		withCheckboxes: true,
	}
	render() {
		const renderToggle = type => {
			return (
				<Switch
					checked={this.state[type]}
					label={type}
					onChange={() => {
						this.setState({
							[type]: !this.state[type]
						});
					}}
				/>
			);
		};

		const { tableParams } = this.props;
		const {page, pageSize} = tableParams
		let entitiesToPass = []
		if (this.state.isInfinite) {
			entitiesToPass = entities
		} else {
			for (let i = (page - 1) * pageSize; i < page*pageSize; i++) {
				entities[i] && entitiesToPass.push(entities[i])
			}
		}
		return (
			<div>
				{renderToggle("withTitle")}
				{renderToggle('withSearch')}
				{renderToggle('withPaging')}
				{renderToggle('isInfinite')}
				{renderToggle('isLoading')}
				{renderToggle('withCheckboxes')}
				<ReactTable
					{...tableParams}
					entities={entitiesToPass}
					entityCount={entities.length}
					onDoubleClick={function() {
						console.log("double clicked");
					}}
					height={'20%'}
					title={'Demo table'}
					contextMenu={function(/*{
						selectedRecords,
						history,
						selectedRows,
						regions
					}*/) {
						return [
							<MenuItem
								key={1}
								onClick={function() {
									console.log("I got clicked!");
								}}
								text={"Menu text here"}
							/>,
							<MenuItem
								key={2}
								onClick={function() {
									console.log("I also got clicked!");
								}}
								text={"Some more"}
							/>
						];
					}}
					withTitle={this.state.withTitle}
					withSearch={this.state.withSearch}
					withPaging={this.state.withPaging}
					isInfinite={this.state.isInfinite}
					isLoading={this.state.isLoading}
					withCheckboxes={this.state.withCheckboxes}
					onRefresh={() => {
						alert("clicked refresh!");
					}}
					// history={history}
					onSingleRowSelect={noop}
					onDeselect={noop}
					onMultiRowSelect={noop}
				/>
				<br/>
				<br/>
				
			</div>
		);
	}
}

function noop() {}
