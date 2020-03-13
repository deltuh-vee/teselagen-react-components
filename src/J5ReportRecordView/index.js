import React, { Component } from "react";
// import EditViewHOC from '../../EditViewHOC'
import { reduxForm } from "redux-form";
import { Button, Dialog, Classes, Colors } from "@blueprintjs/core";
import { getApolloMethods } from "@teselagen/apollo-methods";
import { get, startCase, times, zip, flatten, noop } from "lodash";
import moment from "moment";
import papaparse from "papaparse";
import { ApolloConsumer } from "react-apollo";
import Loading from "../Loading";
import magicDownload from "../DownloadLink/magicDownload";
import showProgressToast from "../utils/showProgressToast";
import getDefaultSchemas from "./getDefaultSchemas";
import schemasPrev from "./schemasPrev";
import { getLinkDialogProps } from "./utils";
import exportOligosFields from "./exportOligosFields";
import J5TableCard from "./J5TableCard";
import RecordInfoTable from "./RecordInfoTable";
import processDataForTables from "./processDataForTables";
import "./style.css";

const sharedTableProps = {
  withSearch: false,
  maxHeight: 400,
  showCount: true,
  withDisplayOptions: true,
  doNotShowEmptyRows: true,
  isLoading: false,
  urlConnected: false
};

class J5ReportRecordView extends Component {
  state = {
    linkDialogName: undefined,
    partCidMap: {},
    exportingCsv: false,
    loadingExportOligos: false
  };
  showLinkModal = name => {
    this.setState({ linkDialogName: name });
  };
  hideLinkModal = () => {
    this.setState({ linkDialogName: undefined });
  };
  handleLinkTabChange = name => {
    this.setState({ linkDialogName: name });
  };

  handleExportOligosToCsv = async apolloClient => {
    const { data, fragmentMap } = this.props;
    let oligos;
    if (fragmentMap) {
      this.setState({
        loadingExportOligos: true
      });
      try {
        const { makeSafeQueryWithToast } = getApolloMethods(apolloClient);
        const safeQuery = makeSafeQueryWithToast(showProgressToast);
        oligos = await safeQuery(fragmentMap.j5OligoSynthesis, {
          variables: {
            filter: {
              j5ReportId: data.j5Report.id
            }
          }
        });
      } catch (error) {
        console.error("error:", error);
        window.toastr.error("Error exporting oligos.");
      }
      this.setState({
        loadingExportOligos: false
      });
    } else {
      oligos = data.j5Report.j5OligoSyntheses;
    }
    const j5OligoSyntheses = processDataForTables.j5OligoSynthesis(oligos);
    const csvString = papaparse.unparse([
      ["OligoSynthesis"],
      exportOligosFields.map(field => field.displayName),
      ...j5OligoSyntheses.map(j5Oligo =>
        exportOligosFields.map(field => get(j5Oligo, field.path))
      )
    ]);
    magicDownload(csvString, `Oligo_Synthesis_${data.j5Report.name}.csv`);
  };

  // downloadCSV = () => {
  //   const entitiesForAllTables = this.getEntitiesForAllTables();
  //   let csvString = "";
  //   each(schemas, (schema, modelType) => {
  //     const entities = entitiesForAllTables[modelType];
  //     const tableCsvString = papaparse.unparse(
  //       entities.map(row => {
  //         return schema.fields.reduce((acc, field) => {
  //           acc[field.displayName || field.path] = get(row, field.path);
  //           return acc;
  //         }, {});
  //       })
  //     );
  //     csvString +=
  //       startCase(modelType).replace("J 5", "j5") +
  //       "\n" +
  //       tableCsvString +
  //       "\n\n";
  //   });
  //   magicDownload(csvString, "j5_Report.csv");
  // };

  // getEntitiesForAllTables = () => {
  //   const { data } = this.props;
  //   const {
  //     j5PcrReactions,
  //     j5OligoSyntheses,
  //     j5AssemblyPieces,
  //     j5RunConstructs,
  //     j5InputSequences,
  //     j5DirectSyntheses
  //     // j5InputParts
  //   } = data.j5Report;

  //   const j5InputParts =
  //     j5InputSequences && getInputPartsFromInputSequences(j5InputSequences);
  //   return {
  //     prebuiltConstructs:
  //       j5RunConstructs && processPrebuiltConstructs(j5RunConstructs),
  //     j5RunConstructs:
  //       j5RunConstructs && processJ5RunConstructs(j5RunConstructs),
  //     j5InputSequences:
  //       j5InputSequences && processInputSequences(j5InputSequences),
  //     j5InputParts: j5InputParts && processInputParts(j5InputParts),
  //     j5OligoSyntheses:
  //       j5OligoSyntheses && this.processJ5OligoSynthesis(j5OligoSyntheses),
  //     j5DirectSyntheses:
  //       j5DirectSyntheses && processJ5DirectSyntheses(j5DirectSyntheses),
  //     j5PcrReactions: j5PcrReactions && processJ5PcrReactions(j5PcrReactions),
  //     j5AssemblyPieces:
  //       j5AssemblyPieces && processJ5AssemblyPieces(j5AssemblyPieces)
  //   };
  // };

  onExportAsCsvClick = async () => {
    this.setState({
      exportingCsv: true
    });
    await this.props.onExportAsCsvClick();
    this.setState({
      exportingCsv: false
    });
  };

  renderDownloadButton = () => {
    // option to override export handler
    const { onExportAsCsvClick } = this.props;
    if (onExportAsCsvClick) {
      return (
        <Button loading={this.state.exportingCsv} onClick={onExportAsCsvClick}>
          Export as CSV
        </Button>
      );
    }
  };

  renderDownloadOligoButton = () => {
    // option to override export handler
    const { onExportOligosAsCsvClick } = this.props;
    return (
      <ApolloConsumer>
        {client => {
          const clickFn = () => this.handleExportOligosToCsv(client);
          return (
            <Button
              loading={this.state.loadingExportOligos}
              onClick={onExportOligosAsCsvClick || clickFn}
            >
              Export as CSV
            </Button>
          );
        }}
      </ApolloConsumer>
    );
  };

  linkInputSequences = () => {
    this.showLinkModal("inputSequences");
  };
  getAssemblyMethod = () => {
    const { assemblyMethod } = this.props.data.j5Report;
    return startCase(assemblyMethod);
  };

  createPartCidMap(props) {
    const j5InputSequences = get(props, "data.j5Report.j5InputSequences");
    if (!j5InputSequences) return;
    const partCidMap = j5InputSequences.reduce((acc, s) => {
      s.j5InputParts.forEach(p => {
        const sequencePart = p.sequencePart;
        if (sequencePart.cid && !acc[sequencePart.cid]) {
          acc[sequencePart.cid.split("-")[1]] = sequencePart;
        }
      });
      return acc;
    }, {});
    this.setState({
      partCidMap
    });
  }

  UNSAFE_componentWillReceiveProps = nextProps => {
    const j5InputSequences = get(nextProps, "data.j5Report.j5InputSequences");
    const oldJ5InputSequences = get(
      this.props,
      "data.j5Report.j5InputSequences"
    );
    if (!(j5InputSequences === oldJ5InputSequences)) {
      this.createPartCidMap(nextProps);
    }
  };

  UNSAFE_componentWillMount() {
    this.createPartCidMap(this.props);
  }

  renderHeader = () => {
    const {
      data,
      additionalHeaderButtons,
      LinkJ5TableDialog,
      LinkJ5ReportButton,
      additionalHeaderComponent
    } = this.props;

    if (data.loading) return <Loading loading />;

    if (!data.j5Report) {
      return <div>No report found!</div>;
    }

    // JSON.parse(localStorage.getItem('TEMPORARY_j5Run')) || {}
    const { name, assemblyType, createdAt, dateRan, design } = data.j5Report;

    const infoFields = [
      [
        ["Design Name", design && design.name ? design.name : name],
        ["Assembly Method", this.getAssemblyMethod()],
        ["Assembly Type", assemblyType],
        ["Date Ran", moment(dateRan || createdAt).format("lll")] //fallback to createdAt if dateRan isn't provided (dateRan is derived from the imported j5report)
      ]
    ];

    return (
      <div className="j5-report-header tg-card">
        {/*{Title}
  <form onSubmit={handleSubmit(onSubmit)} className={'form-layout'}>
    <InputField name="designName" label="Design Name" />
    <InputField name="runDate" label="Run Date" />
    <InputField name="parameterPreset" label="Parameter Preset" />
    <InputField name="assemblyMethod" label="Assembly Method" />
    <InputField name="assemblyType" label="Assembly Type" />
    {Footer}
  </form>*/}
        <RecordInfoTable sections={infoFields} />
        {additionalHeaderComponent}
        {/* tnr: add these in when they are available in lims/hde */}
        {/* <div>
      <span className="j5-report-fieldname">User Name:</span>{" "}
      {assemblyType}
    </div>
    <div>
      <span className="j5-report-fieldname">Design Name:</span>{" "}
      {assemblyType}
    </div>
    <div>
      <span className="j5-report-fieldname">Run Date:</span>{" "}
      {assemblyType}
    </div>
    <div>
      <span className="j5-report-fieldname">Parameter Preset:</span>{" "}
      {assemblyType}
    </div> */}
        <div style={{ marginTop: 10 }}>
          {this.renderDownloadButton()}
          {additionalHeaderButtons}
          {LinkJ5TableDialog && !LinkJ5ReportButton && (
            <Button onClick={this.linkInputSequences}>
              Link j5 Assembly Report Data to Materials
            </Button>
          )}
          {LinkJ5ReportButton && (
            <LinkJ5ReportButton j5Report={data.j5Report} />
          )}
        </div>
      </div>
    );
  };

  createSchemaForCombinationOfAssemblyPieces = j5RunConstructs => {
    let maxNumAssemblyPieces = 0;
    j5RunConstructs.forEach(c => {
      const numAssemblyPieces = c.j5ConstructAssemblyPieces.length;
      if (numAssemblyPieces > maxNumAssemblyPieces)
        maxNumAssemblyPieces = numAssemblyPieces;
    });
    const assemblyPieceColumns = times(maxNumAssemblyPieces, i => ({
      path: `j5ConstructAssemblyPieces[${i}].assemblyPiece.id`,
      displayName: `Piece-${i + 1} ID`
    }));
    const partsContainedColumns = times(maxNumAssemblyPieces, i => {
      return {
        path: `j5ConstructAssemblyPieces[${i}].assemblyPiece.j5AssemblyPieceParts`,
        displayName: `Piece-${i + 1} Parts`,
        render: v => {
          if (typeof v === "string") {
            return v;
          }
          return (
            v && v.map(p => get(p, "j5InputPart.sequencePart.name")).join(", ")
          );
        }
      };
    });
    const extraColumns = flatten(
      zip(assemblyPieceColumns, partsContainedColumns)
    );
    return {
      fields: [
        { path: "name", type: "string", displayName: "Construct Name" },
        {
          path: "id",
          type: "string",
          displayName: "Assembly ID"
        },
        {
          type: "string",
          displayName: "Assembly Method",
          render: () => this.getAssemblyMethod()
        },
        ...extraColumns
      ]
    };
  };

  isGibson() {
    const { data } = this.props;
    if (!data.j5Report) return false;
    return data.j5Report.assemblyMethod === "SLIC/Gibson/CPEC";
  }

  isGoldenGate() {
    const { data } = this.props;
    if (!data.j5Report) return false;
    return data.j5Report.assemblyMethod === "GoldenGate";
  }

  /**
   * Given the model (pluralized) get the schema corresponding to the model. This
   * will either be the default schema or the one returned by the prop `getSchema`
   * if that prop is passed. The prop will be called with the model as the first argument and
   * the default schema as its second argument. The prop should not mutate the schema.
   * @param {string} model Should be pluralized.
   */
  getSchema(model) {
    if (model === "combinationOfAssemblyPieces") {
      throw new Error(
        "Due pecularities in the code, we cannot override the schema for combinationOfAssemblyPieces"
      );
    }

    const defaultSchema = getDefaultSchemas(
      this.isGoldenGate(),
      this.isGibson()
    )[model];
    const passedGetSchema = this.props.getSchema;

    if (passedGetSchema) {
      return passedGetSchema(model, defaultSchema);
    } else {
      return defaultSchema;
    }
  }

  /**
   * Given the model (pluralized) get the schema prior to the j5v4 refactor corresponding to the model.
   * This will either be the default schema or the one returned by the prop `getSchema`
   * if that prop is passed. The prop will be called with the model as the first argument and
   * the default schema as its second argument. The prop should not mutate the schema.
   * @param {string} model Should be pluralized.
   */
  getSchemaPrev(model) {
    if (model === "combinationOfAssemblyPieces") {
      throw new Error(
        "Due pecularities in the code, we cannot override the schema for combinationOfAssemblyPieces"
      );
    }

    const defaultSchema = schemasPrev[model];
    const passedGetSchema = this.props.getSchema;

    if (passedGetSchema) {
      return passedGetSchema(model, defaultSchema);
    } else {
      return defaultSchema;
    }
  }

  render() {
    const {
      data,
      getIsLinkedCellRenderer,
      LinkJ5TableDialog,
      LinkJ5ReportButton,
      onConstructDoubleClick = noop,
      pcrReactionsTitleElements,
      constructsTitleElements = [],
      oligosTitleElements = [],
      linkDialogWidth = 500,
      fragmentMap = {},
      linkFragmentMap,
      noPrebuiltConstructs = false,
      customSchemaGeneratorForAssemblies,
      dataTableProps: passedDataTableProps,
      synthonSequenceTitleElements = []
    } = this.props;

    const { linkDialogName } = this.state;

    if (data.loading) return <Loading loading />;

    if (!data.j5Report) {
      return <div>No report found!</div>;
    }
    const j5Report = data.j5Report;
    const isLinkable = LinkJ5TableDialog || LinkJ5ReportButton;
    const linkDialogProps = getLinkDialogProps(
      data.j5Report,
      linkFragmentMap || fragmentMap
    );
    const currentLink = linkDialogProps[linkDialogName];
    const linkKeys = Object.keys(linkDialogProps);
    let moveToNextTable;
    let moveToPreviousTable;
    if (linkDialogName) {
      const currIndex = linkKeys.indexOf(linkDialogName);
      const nextKey = linkKeys[currIndex + 1];
      const prevKey = linkKeys[currIndex - 1];
      moveToNextTable =
        nextKey &&
        (() => {
          this.setState({
            linkDialogName: nextKey
          });
        });
      moveToPreviousTable =
        prevKey &&
        (() => {
          this.setState({
            linkDialogName: prevKey
          });
        });
    }
    let dataTableProps = sharedTableProps;
    if (passedDataTableProps) {
      dataTableProps = {
        ...sharedTableProps,
        ...passedDataTableProps
      };
    }

    return (
      <div className="j5-report-container">
        <div style={{ display: "flex-columns" }}>
          {this.renderHeader()}

          {/* tnr: this is just the dialog that needs to be on the page. not actually rendering anything */}
          {LinkJ5TableDialog && (
            <Dialog
              style={{ width: linkDialogWidth }}
              {...(currentLink ? currentLink.dialogProps : {})}
              onClose={this.hideLinkModal}
              isOpen={!!linkDialogName}
            >
              <LinkJ5TableDialog
                {...{
                  ...currentLink,
                  moveToNextTable,
                  moveToPreviousTable,
                  tabs: linkDialogProps,
                  selectedTab: linkDialogName,
                  handleTabChange: this.handleLinkTabChange
                }}
                hideModal={this.hideLinkModal}
              />
            </Dialog>
          )}

          {!noPrebuiltConstructs && (
            <J5TableCard
              j5ReportId={j5Report.id}
              helperMessage="Prebuilt constructs are the desired sequences that have already
               been built and are available in your library."
              title="Prebuilt Constructs"
              processData={processDataForTables.prebuiltConstruct}
              entities={
                get(j5Report, "j5RunConstructs[0].isPrebuilt") !== null &&
                !j5Report.j5RunConstructs
                  ? j5Report.j5RunConstructs
                  : []
              }
              fragment={fragmentMap.j5RunConstruct}
              showLinkModal={() => this.showLinkModal("constructs")}
              isLinkable={isLinkable}
              onDoubleClick={onConstructDoubleClick}
              schema={
                j5Report.version
                  ? this.getSchema("j5RunConstructs")
                  : this.getSchemaPrev("j5RunConstructs")
              }
              tableProps={dataTableProps}
            />
          )}

          <J5TableCard
            j5ReportId={j5Report.id}
            helperMessage="Constructs are the desired sequences to be built in a j5 run."
            title="Assembled Constructs"
            processData={processDataForTables.j5RunConstruct}
            SubComponent={
              !j5Report.version
                ? null
                : rowData => {
                    if (rowData.original.j5LogMessages.length === 0)
                      return (
                        <div
                          style={{
                            marginLeft: "2em",
                            marginTop: "0.5em",
                            fontSize: "1.3em",
                            userSelect: "text",
                            color: Colors.GREEN3
                          }}
                        >
                          No warnings or errors for this construct
                        </div>
                      );
                    return (
                      <div
                        className="tg-test-warning-box"
                        style={{
                          userSelect: "text",
                          marginLeft: "2em",
                          marginTop: "1em"
                        }}
                      >
                        <div style={{ fontSize: "1.5em", color: Colors.GOLD3 }}>
                          {"Warnings:"}
                        </div>
                        <br />
                        {rowData.original.j5LogMessages.map((log, i) => (
                          <div
                            key={Date.now() + i}
                            style={{
                              padding: "1em",
                              fontSize: "1em"
                            }}
                          >{`• ${log.message}`}</div>
                        ))}
                      </div>
                    );
                  }
            }
            entities={
              get(j5Report, "j5RunConstructs[0].isPrebuilt") !== null &&
              !fragmentMap.j5RunConstruct
                ? []
                : j5Report.j5RunConstructs
            }
            fragment={fragmentMap.j5RunConstruct}
            showLinkModal={() => this.showLinkModal("constructs")}
            isLinkable={isLinkable}
            onDoubleClick={onConstructDoubleClick}
            tableProps={dataTableProps}
            columnToSortBy="constructName"
            schema={
              j5Report.version
                ? this.getSchema("j5RunConstructs")
                : this.getSchemaPrev("j5RunConstructs")
            }
            openTitleElements={constructsTitleElements}
          />

          <J5TableCard
            j5ReportId={j5Report.id}
            helperMessage="Input Sequences are the sequences that contain the Input Parts."
            title="Input Sequences"
            processData={processDataForTables.j5InputSequence}
            entities={j5Report.j5InputSequences}
            fragment={fragmentMap.j5InputSequence}
            showLinkModal={() => this.showLinkModal("inputSequences")}
            isLinkable={isLinkable}
            tableProps={dataTableProps}
            cellRenderer={
              getIsLinkedCellRenderer &&
              getIsLinkedCellRenderer(
                "sequence.polynucleotideMaterialId",
                "sequence.hash",
                "j5InputSequence"
              )
            }
            schema={
              j5Report.version
                ? this.getSchema("j5InputSequences")
                : this.getSchemaPrev("j5InputSequences")
            }
          />

          <J5TableCard
            j5ReportId={j5Report.id}
            helperMessage="Input Parts are the segments of sequence that are being used in
            a j5 run."
            title="Input Parts"
            processData={processDataForTables.j5InputPart}
            entities={j5Report.j5InputSequences}
            fragment={fragmentMap.j5InputSequence}
            tableProps={dataTableProps}
            schema={
              j5Report.version
                ? this.getSchema("j5InputParts")
                : this.getSchemaPrev("j5InputParts")
            }
          />

          <J5TableCard
            j5ReportId={j5Report.id}
            helperMessage="This is the list of oligos that need to be directly synthesized."
            title="Assembly Oligos"
            processData={processDataForTables.j5OligoSynthesis}
            entities={j5Report.j5OligoSyntheses}
            fragment={fragmentMap.j5OligoSynthesis}
            tableProps={dataTableProps}
            columnToSortBy="oligoName"
            isLinkable={isLinkable}
            schema={
              j5Report.version
                ? this.getSchema("j5OligoSyntheses")
                : this.getSchemaPrev("j5OligoSyntheses")
            }
            showLinkModal={() => this.showLinkModal("oligos")}
            linkButtonText="Link Oligos"
            openTitleElements={oligosTitleElements}
            cellRenderer={
              getIsLinkedCellRenderer &&
              getIsLinkedCellRenderer(
                "oligo.sequence.polynucleotideMaterialId",
                "oligo.sequence.hash",
                "oligo"
              )
            }
          >
            <div className={Classes.BUTTON_GROUP} style={{ marginTop: 10 }}>
              {this.renderDownloadOligoButton()}
            </div>
          </J5TableCard>

          <J5TableCard
            j5ReportId={j5Report.id}
            helperMessage="This is the list of annealed oligos."
            title="Annealed Oligos"
            processData={processDataForTables.j5AnnealedOligo}
            entities={j5Report.j5OligoSyntheses}
            fragment={fragmentMap.j5OligoSynthesis}
            tableProps={dataTableProps}
            isLinkable={isLinkable}
            columnToSortBy="oligoName"
            schema={
              j5Report.version
                ? this.getSchema("j5AnnealedOligos")
                : this.getSchemaPrev("j5AnnealedOligos")
            }
            showLinkModal={() => this.showLinkModal("oligos")}
            linkButtonText="Link Oligos"
            cellRenderer={
              getIsLinkedCellRenderer &&
              getIsLinkedCellRenderer(
                "oligo.sequence.polynucleotideMaterialId",
                "oligo.sequence.hash",
                "oligo"
              )
            }
          />

          <J5TableCard
            j5ReportId={j5Report.id}
            helperMessage="This is the list DNA pieces that need to be directly synthesized."
            title="Synthon Sequences"
            processData={processDataForTables.j5DirectSynthesis}
            entities={j5Report.j5DirectSyntheses}
            tableProps={dataTableProps}
            schema={
              j5Report.version
                ? this.getSchema("j5DirectSyntheses")
                : this.getSchemaPrev("j5DirectSyntheses")
            }
            fragment={fragmentMap.j5DirectSynthesis}
            isLinkable={isLinkable}
            showLinkModal={() => this.showLinkModal("dnaSynthesisSequences")}
            linkButtonText="Link DNA Synthesis Pieces"
            openTitleElements={synthonSequenceTitleElements}
            columnToSortBy="name"
            cellRenderer={
              getIsLinkedCellRenderer &&
              getIsLinkedCellRenderer(
                "oligo.sequence.polynucleotideMaterialId",
                "oligo.sequence.hash",
                "oligo"
              )
            }
          />

          <J5TableCard
            j5ReportId={j5Report.id}
            helperMessage="These are the PCR reactions that need to be run to generate the
                assembly pieces."
            title="PCRs"
            processData={processDataForTables.j5PcrReaction}
            entities={j5Report.j5PcrReactions}
            tableProps={dataTableProps}
            openTitleElements={pcrReactionsTitleElements}
            fragment={fragmentMap.j5PcrReaction}
            columnToSortBy="pcrId"
            schema={
              j5Report.version
                ? this.getSchema("j5PcrReactions")
                : this.getSchemaPrev("j5PcrReactions")
            }
          />

          <J5TableCard
            j5ReportId={j5Report.id}
            helperMessage="These are the pieces of DNA that will get put together in a
                final assembly reaction (Gibson/CPEC/SLIC/Golden-Gate) to give
                the desired Constructs."
            title="Assembly Pieces"
            processData={processDataForTables.j5AssemblyPiece}
            entities={j5Report.j5AssemblyPieces}
            fragment={fragmentMap.j5AssemblyPiece}
            isLinkable={isLinkable}
            showLinkModal={() => this.showLinkModal("dnaPieces")}
            linkButtonText="Link DNA Pieces"
            tableProps={dataTableProps}
            columnToSortBy="pieceId"
            schema={
              j5Report.version
                ? this.getSchema("j5AssemblyPieces")
                : this.getSchemaPrev("j5AssemblyPieces")
            }
            cellRenderer={
              getIsLinkedCellRenderer &&
              getIsLinkedCellRenderer(
                "sequence.polynucleotideMaterialId",
                "sequence.hash",
                "j5AssemblyPiece"
              )
            }
          />

          <J5TableCard
            j5ReportId={j5Report.id}
            helperMessage="This lists which assembly pieces need to be combined to create
                each construct."
            title="Assemblies"
            processData={processDataForTables.j5RunConstruct}
            entities={
              get(j5Report, "j5RunConstructs[0].isPrebuilt") !== null &&
              !fragmentMap.j5RunConstruct
                ? []
                : j5Report.j5RunConstructs
            }
            fragment={fragmentMap.j5RunConstruct}
            tableProps={dataTableProps}
            createSchema={
              customSchemaGeneratorForAssemblies ||
              this.createSchemaForCombinationOfAssemblyPieces
            }
          />

          {/*<div className="tg-card">
          <div style={tableHeaderDivStyle}>
            Assembly Piece Combinations
            displays which assembly pieces to combine together to generate each of the desired combinatorial variants.

            {this.renderCloseTableButton('assemblyPieceCombinations')}
          </div>
          {assemblyPieceCombinationsTableOpen &&
            <DataTable
              withSearch={false}
              isInfinite={true}
              maxHeight={400}
              hidePageSizeWhenPossible
              doNotShowEmptyRows
              isLoading={false}
              urlConnected={false}
            />}
        </div>*/}
        </div>
      </div>
    );
  }
}

// Decorate the form component
export default reduxForm({
  form: "j5Report" // a unique name for this form
})(J5ReportRecordView);
