import { useRef } from "react";
import type { SyntheticEvent } from "react";
import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import Autocomplete from "@mui/material/Autocomplete";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import { alpha, useTheme } from "@mui/material/styles";

export type AutocompleteFilterOption = {
  value: string | number;
  label: string;
};

type AutocompleteFilterProps = {
  options: AutocompleteFilterOption[];
  value: AutocompleteFilterOption[];
  onChange: (event: SyntheticEvent, newValue: AutocompleteFilterOption[]) => void;
  label: string;
  placeholder?: string;
  limitTags?: number;
};

/**
 * Multi-select autocomplete filter (EMS.WEB pattern: AgentFilter + AutocompleteFilter).
 * Optional “Add all” adds every option not already selected.
 */
export default function AutocompleteFilter({
  options,
  value,
  onChange,
  label,
  placeholder,
  limitTags = 5,
}: AutocompleteFilterProps) {
  const theme = useTheme();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleAddAll = () => {
    const current = value ?? [];
    const unselectedOptions = options.filter(
      (option) => !current.some((selected) => String(selected.value) === String(option.value))
    );
    onChange({} as SyntheticEvent, [...current, ...unselectedOptions]);
    inputRef.current?.blur();
  };

  const addButtonSx = {
    bgcolor: alpha(theme.palette.primary.main, 0.85),
    color: theme.palette.primary.contrastText,
    mr: 1,
    "&:hover": {
      bgcolor: theme.palette.primary.dark,
    },
  };

  return (
    <Autocomplete
      multiple
      fullWidth
      limitTags={limitTags}
      getOptionLabel={(option) => option.label}
      options={options}
      value={value}
      isOptionEqualToValue={(option, v) => String(option.value) === String(v.value)}
      onChange={onChange}
      renderOption={(props, option) => (
        <li {...props} key={String(option.value)}>
          {option.label}
        </li>
      )}
      renderInput={(params) => (
        <TextField
          id={params.id}
          disabled={params.disabled}
          fullWidth={params.fullWidth}
          size={params.size}
          variant="outlined"
          inputRef={inputRef}
          label={label}
          placeholder={placeholder}
          slotProps={{
            inputLabel: { ...params.slotProps.inputLabel, shrink: true },
            input: {
              ...params.slotProps.input,
              endAdornment: (
                <>
                  {params.slotProps.input.endAdornment}
                  <InputAdornment position="end">
                    <Tooltip title="Add all">
                      <IconButton onClick={handleAddAll} size="small" sx={addButtonSx} aria-label="Add all filter options">
                        <AddCircleOutlineOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                </>
              ),
            },
            htmlInput: params.slotProps.htmlInput,
          }}
        />
      )}
    />
  );
}
