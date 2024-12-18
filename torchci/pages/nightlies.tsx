import { Grid, Paper, Skeleton, Stack, Typography } from "@mui/material";
import TablePanel from "components/metrics/panels/TablePanel";
import { useCHContext } from "components/UseClickhouseProvider";
import dayjs from "dayjs";
import { EChartsOption } from "echarts";
import ReactECharts from "echarts-for-react";
import { fetcher } from "lib/GeneralUtils";
import { TimeRangePicker } from "pages/metrics";
import { useState } from "react";
import useSWR from "swr";

function NightlyJobsRedPanel({
  params,
  repo,
}: {
  params: { [key: string]: string };
  repo: string;
}) {
  let repo_p = params.find(({ name }) => name == "repo");
  if (repo_p && repo) repo_p.value = repo;

  const url = `/api/clickhouse/nightly_jobs_red??parameters=${encodeURIComponent(
    JSON.stringify(params)
  )}`;

  const { data } = useSWR(url, fetcher, {
    refreshInterval: 5 * 60 * 1000, // refresh every 5 minutes
  });

  if (data === undefined) {
    return <Skeleton variant={"rectangular"} height={"100%"} />;
  }

  const options: EChartsOption = {
    title: { text: "% " + repo + " nightly jobs failures" },
    grid: { top: 48, right: 8, bottom: 24, left: 36 },
    dataset: { source: data },
    xAxis: { type: "time" },
    yAxis: {
      type: "value",
      axisLabel: {
        formatter: (value: number) => {
          return (value * 100).toString() + "%";
        },
      },
    },
    series: [
      {
        type: "bar",
        encode: {
          x: "granularity_bucket",
          y: "red",
        },
      },
    ],
    tooltip: {
      trigger: "axis",
      valueFormatter: (value: any) => {
        return (value * 100).toFixed(2) + "%";
      },
    },
  };

  return (
    <Paper sx={{ p: 2, height: "100%" }} elevation={3}>
      <ReactECharts
        style={{ height: "100%", width: "100%" }}
        option={options}
      />
    </Paper>
  );
}

function ValidationRedPanel({
  params,
  channel,
  query_type,
}: {
  params: RocksetParam[];
  channel: string;
  query_type: string;
}) {
  const url =
    `/api/clickhouse/` +
    query_type +
    `_jobs_red?parameters=${encodeURIComponent(
      JSON.stringify([
        ...params,
        {
          name: "timezone",
          type: "string",
          value: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        {
          name: "channel",
          type: "string",
          value: channel,
        },
      ])
    )}`;

  const { data } = useSWR(url, fetcher, {
    refreshInterval: 5 * 60 * 1000, // refresh every 5 minutes
  });

  if (data === undefined) {
    return <Skeleton variant={"rectangular"} height={"100%"} />;
  }

  const options: EChartsOption = {
    title: {
      text:
        channel.charAt(0).toUpperCase() +
        channel.slice(1) +
        " " +
        query_type.charAt(0).toUpperCase() +
        query_type.slice(1) +
        " workflows failures",
    },
    grid: { top: 60, right: 8, bottom: 24, left: 36 },
    dataset: { source: data },
    xAxis: { type: "category" },
    yAxis: {
      type: "value",
    },
    series: [
      {
        type: "bar",
        stack: "all",
        encode: {
          x: "granularity_bucket",
          y: "green",
        },
      },
      {
        type: "bar",
        stack: "all",
        encode: {
          x: "granularity_bucket",
          y: "red",
        },
      },
      {
        type: "bar",
        stack: "all",
        encode: {
          x: "granularity_bucket",
          y: "pending",
        },
      },
    ],
    color: ["#3ba272", "#ee6666", "#f2d643"],
    tooltip: {
      trigger: "axis",
      formatter: (params: any) => {
        const red = params[0].data.red;
        const green = params[0].data.green;
        const pending = params[0].data.pending;
        const total = params[0].data.total;

        const redPct = ((red / total) * 100).toFixed(2) + "%";
        const greenPct = ((green / total) * 100).toFixed(2) + "%";
        const pendingPct = ((pending / total) * 100).toFixed(2) + "%";
        return `Red: ${red} (${redPct})<br/>Green: ${green} (${greenPct})<br/>Pending: ${pending} (${pendingPct})<br/>Total: ${total}`;
      },
    },
  };

  return (
    <Paper sx={{ p: 2, height: "100%" }} elevation={3}>
      <ReactECharts
        style={{ height: "100%", width: "100%" }}
        option={options}
      />
    </Paper>
  );
}

const ROW_HEIGHT = 340;
export default function Page() {
  const [startTime, setStartTime] = useState(dayjs().subtract(1, "week"));
  const [stopTime, setStopTime] = useState(dayjs());
  const [timeRange, setTimeRange] = useState<number>(7);
  const { useCH: useClickHouse } = useCHContext();

  const timeParams: RocksetParam[] = [
    {
      name: "startTime",
      type: "string",
      value: startTime,
    },
    {
      name: "stopTime",
      type: "string",
      value: stopTime,
    },
    {
      name: "repo",
      type: "string",
      value: "pytorch",
    },
  ];

  return (
    <div>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Typography fontSize={"2rem"} fontWeight={"bold"}>
          Nightly Binaries Metrics
        </Typography>
        <TimeRangePicker
          startTime={startTime}
          setStartTime={setStartTime}
          stopTime={stopTime}
          setStopTime={setStopTime}
          timeRange={timeRange}
          setTimeRange={setTimeRange}
        />
      </Stack>

      <Grid container spacing={2}>
        <Grid item xs={6} height={ROW_HEIGHT}>
          <NightlyJobsRedPanel params={timeParams} repo={"pytorch"} />
        </Grid>

        <Grid item xs={6} height={ROW_HEIGHT}>
          <TablePanel
            title={"Nightly PyTorch build jobs for past 24hrs"}
            queryName={"nightly_jobs_red_past_day"}
            queryParams={[
              {
                name: "repo",
                type: "string",
                value: "pytorch",
              },
            ]}
            queryCollection="nightlies"
            columns={[
              { field: "COUNT", headerName: "Count", flex: 1 },
              { field: "name", headerName: "Name", flex: 4 },
            ]}
            dataGridProps={{ getRowId: (el: any) => el.name }}
          />
        </Grid>

        <Grid item xs={6} height={ROW_HEIGHT}>
          <NightlyJobsRedPanel params={timeParams} repo={"vision"} />
        </Grid>

        <Grid item xs={6} height={ROW_HEIGHT}>
          <TablePanel
            title={"Nightly Vision build jobs for past 24hrs"}
            queryName={"nightly_jobs_red_past_day"}
            queryParams={[
              {
                name: "repo",
                type: "string",
                value: "vision",
              },
            ]}
            queryCollection="nightlies"
            columns={[
              { field: "COUNT", headerName: "Count", flex: 1 },
              { field: "name", headerName: "Name", flex: 4 },
            ]}
            dataGridProps={{ getRowId: (el: any) => el.name }}
          />
        </Grid>

        <Grid item xs={6} height={ROW_HEIGHT}>
          <NightlyJobsRedPanel params={timeParams} repo={"audio"} />
        </Grid>

        <Grid item xs={6} height={ROW_HEIGHT}>
          <TablePanel
            title={"Nightly Audio build jobs for past 24hrs"}
            queryName={"nightly_jobs_red_past_day"}
            queryParams={[
              {
                name: "repo",
                type: "string",
                value: "audio",
              },
            ]}
            queryCollection="nightlies"
            columns={[
              { field: "COUNT", headerName: "Count", flex: 1 },
              { field: "name", headerName: "Name", flex: 4 },
            ]}
            dataGridProps={{ getRowId: (el: any) => el.name }}
          />
        </Grid>

        <Grid item xs={6} height={ROW_HEIGHT}>
          <NightlyJobsRedPanel params={timeParams} repo={"text"} />
        </Grid>

        <Grid item xs={6} height={ROW_HEIGHT}>
          <TablePanel
            title={"Nightly Text build jobs for past 24hrs"}
            queryName={"nightly_jobs_red_past_day"}
            queryParams={[
              {
                name: "repo",
                type: "string",
                value: "text",
              },
            ]}
            queryCollection="nightlies"
            columns={[
              { field: "COUNT", headerName: "Count", flex: 1 },
              { field: "name", headerName: "Name", flex: 4 },
            ]}
            dataGridProps={{ getRowId: (el: any) => el.name }}
          />
        </Grid>

        <Grid item xs={6} height={ROW_HEIGHT}>
          <ValidationRedPanel
            params={timeParams}
            channel={"release"}
            query_type={"validation"}
          />
        </Grid>

        <Grid item xs={6} height={ROW_HEIGHT}>
          <TablePanel
            title={"Release failed validation jobs for past 24hrs"}
            queryName={"validation_jobs_red_past_day"}
            queryParams={[
              {
                name: "channel",
                type: "string",
                value: "release",
              },
            ]}
            queryCollection="nightlies"
            columns={[
              { field: "COUNT", headerName: "Count", flex: 1 },
              { field: "name", headerName: "Name", flex: 4 },
            ]}
            dataGridProps={{ getRowId: (el: any) => el.name }}
          />
        </Grid>

        <Grid item xs={6} height={ROW_HEIGHT}>
          <ValidationRedPanel
            params={timeParams}
            channel={"nightly"}
            query_type={"validation"}
          />
        </Grid>

        <Grid item xs={6} height={ROW_HEIGHT}>
          <TablePanel
            title={"Nightly failed validation jobs for past 24hrs"}
            queryName={"validation_jobs_red_past_day"}
            queryParams={[
              {
                name: "channel",
                type: "string",
                value: "nightly",
              },
            ]}
            queryCollection="nightlies"
            columns={[
              { field: "COUNT", headerName: "Count", flex: 1 },
              { field: "name", headerName: "Name", flex: 4 },
            ]}
            dataGridProps={{ getRowId: (el: any) => el.name }}
          />
        </Grid>

        <Grid item xs={6} height={ROW_HEIGHT}>
          <ValidationRedPanel
            params={timeParams}
            channel={""}
            query_type={"docker"}
          />
        </Grid>

        <Grid item xs={6} height={ROW_HEIGHT}>
          <TablePanel
            title={
              "Failed nightly jobs for PyTorch and Domains for selected time range"
            }
            queryName={"nightly_jobs_red_by_name"}
            queryParams={timeParams}
            queryCollection="nightlies"
            columns={[
              { field: "COUNT", headerName: "Count", flex: 1 },
              { field: "name", headerName: "Name", flex: 4 },
            ]}
            dataGridProps={{ getRowId: (el: any) => el.name }}
          />
        </Grid>

        <Grid item xs={6} height={ROW_HEIGHT}>
          <TablePanel
            title={
              "Failed nightly jobs for PyTorch and Domains for selected time range by platform"
            }
            queryName={"nightly_jobs_red_by_platform"}
            queryParams={timeParams}
            queryCollection="nightlies"
            columns={[
              { field: "Count", headerName: "Count", flex: 1 },
              { field: "Platform", headerName: "Platform", flex: 4 },
            ]}
            dataGridProps={{ getRowId: (el: any) => el.Platform }}
          />
        </Grid>
      </Grid>
    </div>
  );
}
