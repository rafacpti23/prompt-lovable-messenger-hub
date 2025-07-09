
import { useState } from "react";
import { useManageInstances } from "@/hooks/useManageInstances";
import { Send } from "lucide-react";
import CreateInstanceForm from "./CreateInstanceForm";
import InstanceList from "./InstanceList";

const InstancesManager = () => {
  const {
    instances,
    loading,
    createInstance,
    connect,
    showQr,
    remove,
  } = useManageInstances();

  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Send className="h-6 w-6 text-green-600" />
          <h2 className="text-2xl font-bold text-foreground">
            Gerenciar Instâncias
          </h2>
        </div>
      </div>
      <CreateInstanceForm
        onCreate={async (name) => {
          setCreating(true);
          await createInstance(name);
          setCreating(false);
        }}
        creating={creating}
      />
      <InstanceList
        instances={instances}
        loading={loading}
        onShowQr={showQr}
        onConnect={connect}
        onDelete={remove}
      />
    </div>
  );
};

export default InstancesManager;
