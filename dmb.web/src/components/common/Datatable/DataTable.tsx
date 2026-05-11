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
import { dataTableSx } from "styles/main_style";

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
    return <Typography sx={dataTableSx.emptyMessage}>{emptyMessage}</Typography>;
  }

  if (isMobile) {
    return (
      <Box sx={dataTableSx.mobileStack}>
        {rows.map((row) => (
          <Card key={getRowId(row)} variant="outlined">
            <CardContent sx={dataTableSx.mobileCardContent}>
              {columns.map((column, columnIndex) => (
                <Box key={`${getRowId(row)}-${column.key}`}>
                  <Box sx={column.key === "actions" ? dataTableSx.mobileCellColumnActions : dataTableSx.mobileCellColumn}>
                    <Typography
                      component="div"
                      variant="caption"
                      sx={column.key === "actions" ? dataTableSx.mobileHeaderCaptionActions : dataTableSx.mobileHeaderCaption}
                    >
                      {column.header}
                    </Typography>
                    <Box
                      sx={[
                        column.key === "actions" ? dataTableSx.mobileValueCellActions : dataTableSx.mobileValueCell,
                        column.key !== "actions" ? dataTableSx.mobileValueCellDefault : {},
                      ]}
                    >
                      {column.render ? (
                        column.render(row)
                      ) : (
                        <Typography sx={dataTableSx.mobileBodyTypography}>
                          {String((row as Record<string, unknown>)[column.key] ?? "")}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  {columnIndex < columns.length - 1 ? <Divider sx={dataTableSx.mobileDivider} /> : null}
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
    <Paper variant="outlined" sx={dataTableSx.paper}>
      <Box sx={dataTableSx.fullWidth}>
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
          sx={dataTableSx.gridRoot}
        />
      </Box>
    </Paper>
  );
}
