import React, { useState, useEffect } from "react";
import axios from "axios";
import { format, subDays, startOfDay } from "date-fns";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { useNavigate } from "react-router-dom";
import "./Activity.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function Activity() {
  const [activities, setActivities] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/admin/activity"
        );
        setActivities(response.data);
      } catch (error) {
        console.error("Error fetching activities:", error);
      }
    };
    fetchActivities();
  }, []);

  const sortedActivities = [...activities].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  const groupedActivities = {
    updatedFiles: sortedActivities.filter(
      (activity) => activity.type === "Updated_Files"
    ),
    rewardsClaimed: sortedActivities.filter(
      (activity) => activity.type === "Reward_Claimed"
    ),
    newClients: sortedActivities.filter(
      (activity) => activity.type === "New_Client"
    ),
  };

  const formatDate = (date) => {
    return format(new Date(date), "MMM dd, yyyy h:mm a");
  };

  const getLast7DaysData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      return startOfDay(subDays(new Date(), i));
    }).reverse();

    const data = last7Days.map((day) => {
      const dayActivities = activities.filter(
        (activity) =>
          startOfDay(new Date(activity.date)).getTime() === day.getTime()
      );

      return {
        date: format(day, "EEE"),
        rewards: dayActivities.filter((a) => a.type === "Reward_Claimed")
          .length,
        clients: dayActivities.filter((a) => a.type === "New_Client").length,
        files: dayActivities.filter((a) => a.type === "Updated_Files").length,
      };
    });

    return data;
  };

  const chartData = {
    labels: getLast7DaysData().map((d) => d.date),
    datasets: [
      {
        label: "REWARDS REQUESTED",
        data: getLast7DaysData().map((d) => d.rewards),
        borderColor: "#f97316",
        tension: 0.3,
      },
      {
        label: "NEW CLIENTS",
        data: getLast7DaysData().map((d) => d.clients),
        borderColor: "#3b82f6",
        tension: 0.3,
      },
      {
        label: "UPDATED FILES",
        data: getLast7DaysData().map((d) => d.files),
        borderColor: "#10b981",
        tension: 0.3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "right",
        align: "center",
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 5,
        },
        grid: {
          display: false,
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  const groupActivitiesByDate = (activities) => {
    const grouped = activities.reduce((acc, activity) => {
      const date = format(new Date(activity.date), "MMM d");
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(activity);
      return acc;
    }, {});
    return grouped;
  };

  const getPageCount = (items) => {
    return Math.ceil(items.length / itemsPerPage);
  };

  const getCurrentPageItems = (items) => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return items.slice(indexOfFirstItem, indexOfLastItem);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const renderPagination = (totalItems) => {
    const pageCount = getPageCount(totalItems);
    const pages = [];

    for (let i = 1; i <= pageCount; i++) {
      pages.push(
        <button
          key={i}
          className={currentPage === i ? "active" : ""}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="pagination">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          {"<"}
        </button>
        {pages}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === pageCount}
        >
          {">"}
        </button>
      </div>
    );
  };

  const handleFileClick = (activity) => {
    console.log(activity);
    navigate(`/`, {
      state: { documentType: activity.document_submitted },
    });
  };

  const handleRewardClick = (activity) => {
    console.log(activity);
    navigate(`/rewards`, {
      state: { clientId: activity.clientId },
    });
  };

  return (
    <div className="activity-container">
      <div className="activity-header">
        <select>
          <option>Last 24 hours</option>
        </select>
      </div>

      <div className="chart-wrapper">
        <Line data={chartData} options={chartOptions} />
      </div>

      <div className="activity-stats">
        <div className="updated-box">
          <h3>Updated files</h3>
          <span>{groupedActivities.updatedFiles.length}</span>
        </div>
        <div className="claimed-box">
          <h3>Rewards Claimed</h3>
          <span>{groupedActivities.rewardsClaimed.length}</span>
        </div>
      </div>

      <div className="activity-columns">
        <div className="activity-log">
          {Object.entries(
            groupActivitiesByDate(
              getCurrentPageItems(groupedActivities.updatedFiles)
            )
          ).map(([date, activities]) => (
            <React.Fragment key={date}>
              <h4>{date}</h4>
              {activities.map((activity) => (
                <div
                  key={activity._id}
                  className="activity-box"
                  onClick={() => handleFileClick(activity)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="initials">TJ</div>
                  <div className="info">
                    <div className="client-name">{activity.clientName}</div>
                    <div className="detail">
                      Submitted {activity.document_submitted}
                    </div>
                  </div>
                </div>
              ))}
            </React.Fragment>
          ))}
          {renderPagination(groupedActivities.updatedFiles)}
        </div>

        <div className="claimed-log">
          {getCurrentPageItems(groupedActivities.rewardsClaimed).map(
            (activity, i) => (
              <div
                key={activity._id}
                className="claimed-box-item"
                onClick={() => handleRewardClick(activity)}
                style={{ cursor: "pointer" }}
              >
                <div className="client-name">{activity.clientName}</div>
                <div className="for-label">FOR CLIENT</div>
                <div className="item">Gift : {activity.rewardName}</div>
              </div>
            )
          )}
          {renderPagination(groupedActivities.rewardsClaimed)}
        </div>
      </div>
    </div>
  );
}

export default Activity;
