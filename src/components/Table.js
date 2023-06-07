export default function Table({ data }) {
  if (data.length == 0) {
    return null;
  }

  let keys = Object.keys(data[0]);

  return (
    <div>
      <table className="main-table">
        <thead>
          <tr>
            {keys.map((key) => (
              <td key={key}>{key}</td>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((entry) => {
            return (
              <tr>
                {keys.map((key) => {
                  let value = entry[key];
                  return <td>{value}</td>;
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
