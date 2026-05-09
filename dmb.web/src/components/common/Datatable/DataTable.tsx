import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";
import type { ReactNode } from "react";

export type DataTableColumn<TRow> = {
  key: string;
  header: string;
  render?: (row: TRow) => ReactNode;
};

type DataTableProps<TRow> = {
  rows: TRow[];
  columns: DataTableColumn<TRow>[];
  emptyMessage?: string;
  getRowId: (row: TRow) => string | number;
  hideColumnFilter?: boolean;
  hideToolbar?: boolean;
  defaultPageSize?: number;
};

export default function DataTable<TRow>({
  rows,
  columns,
  emptyMessage = "No records found.",
  getRowId,
  hideColumnFilter = true,
  hideToolbar = false,
  defaultPageSize = 50,
}: DataTableProps<TRow>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  if (rows.length === 0) {
    return <Typography sx={{ color: "#64748b" }}>{emptyMessage}</Typography>;
  }

  if (isMobile) {
    return (
      <Box sx={{ display: "grid", gap: 1.5 }}>
        {rows.map((row, rowIndex) => (
          <Card key={getRowId(row)} variant="outlined">
            <CardContent sx={{ display: "grid", gap: 1 }}>
              {columns.map((column, columnIndex) => (
                <Box key={`${getRowId(row)}-${column.key}`}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: column.key === "actions" ? "center" : "stretch",
                      gap: 0.5,
                    }}
                  >
                    <Typography
                      component="div"
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        color: "#64748b",
                        letterSpacing: "0.02em",
                        textTransform: "uppercase",
                        textAlign: column.key === "actions" ? "center" : undefined,
                        width: column.key === "actions" ? "100%" : undefined,
                      }}
                    >
                      {column.header}
                    </Typography>
                    <Box
                      sx={{
                        textAlign: column.key === "actions" ? "center" : "left",
                        width: "100%",
                        ...(column.key === "actions"
                          ? {
                              "& .MuiStack-root": {
                                width: "100%",
                                justifyContent: "center",
                                alignItems: "center",
                              },
                              "& .MuiIconButton-root": { flexShrink: 0 },
                              "& .MuiStack-root > span": { display: "inline-flex", flexShrink: 0 },
                            }
                          : {
                              "& .MuiButton-root": { justifyContent: "flex-start", px: 0, minWidth: 0 },
                            }),
                      }}
                    >
                      {column.render ? (
                        column.render(row)
                      ) : (
                        <Typography sx={{ textAlign: "justify", hyphens: "auto", wordBreak: "break-word" }}>
                          {String((row as Record<string, unknown>)[column.key] ?? "")}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  {columnIndex < columns.length - 1 ? <Divider sx={{ mt: 1 }} /> : null}
                </Box>
              ))}
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  }

  const dataGridColumns: GridColDef[] = columns.map((column) => ({
    field: column.key,
    headerName: column.header,
    flex: 1,
    minWidth: 150,
    sortable: false,
    filterable: !hideColumnFilter,
    align: column.key === "actions" ? "center" : "left",
    headerAlign: column.key === "actions" ? "center" : undefined,
    renderCell: (params) => {
      const row = params.row as TRow;
      return column.render ? column.render(row) : String((row as Record<string, unknown>)[column.key] ?? "");
    },
  }));

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, overflowX: "auto" }}>
      <Box sx={{ width: "100%" }}>
        <DataGrid
          disableColumnFilter={hideColumnFilter}
          disableRowSelectionOnClick
          slots={!hideToolbar ? { toolbar: GridToolbar } : undefined}
          rows={rows}
          columns={dataGridColumns}
          getRowId={(row) => getRowId(row as TRow)}
          initialState={{
            pagination: { paginationModel: { pageSize: defaultPageSize, page: 0 } },
          }}
          pageSizeOptions={[5, 10, 20, 50, 100]}
          autoHeight
          sx={{
            // Paper provides the outer border; keep grid clean and add subtle separators.
            border: 0,
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "#f8fafc",
              borderBottom: "1px solid rgba(15, 23, 42, 0.12)",
            },
            "& .MuiDataGrid-columnHeader, & .MuiDataGrid-cell": {
              px: 2,
            },
            "& .MuiDataGrid-columnHeader": {
              justifyContent: "center",
            },
            "& .MuiDataGrid-columnHeaderTitleContainer": {
              justifyContent: "center",
            },
            "& .MuiDataGrid-columnHeaderTitle": {
              fontWeight: 700,
              textAlign: "center",
              width: "100%",
            },
            "& .MuiDataGrid-cell": {
              borderBottom: "1px solid rgba(15, 23, 42, 0.08)",
            },
            '& .MuiDataGrid-columnHeader[data-field="actions"]': {
              display: "flex",
              justifyContent: "center",
            },
            '& .MuiDataGrid-cell[data-field="actions"]': {
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            },
            "& .MuiDataGrid-row:hover": {
              backgroundColor: "rgba(2, 6, 23, 0.02)",
            },
            // Align pagination: rows-per-page label, select, and arrows
            "& .MuiTablePagination-toolbar": {
              minHeight: 56,
              alignItems: "center",
              gap: 1,
              paddingTop: 0,
              paddingBottom: 0,
            },
            "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
              margin: 0,
              alignSelf: "center",
            },
            "& .MuiTablePagination-input": {
              margin: 0,
              alignSelf: "center",
            },
            "& .MuiTablePagination-actions": {
              marginLeft: 0,
              alignSelf: "center",
              display: "flex",
              alignItems: "center",
            },
          }}
        />
      </Box>
    </Paper>
  );
}
