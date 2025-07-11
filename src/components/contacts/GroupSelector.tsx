
import React, { useState } from "react";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface GroupSelectorProps {
  groups: string[];
  value: string;
  onChange: (group: string) => void;
  onCreateGroup: (group: string) => void;
}

const GroupSelector: React.FC<GroupSelectorProps> = ({ groups, value, onChange, onCreateGroup }) => {
  const [creating, setCreating] = useState(false);
  const [newGroup, setNewGroup] = useState("");

  const handleSelect = (val: string) => {
    if (val === "__new__") {
      setCreating(true);
      setTimeout(() => {
        document.getElementById("new-group-input")?.focus();
      }, 100);
    } else {
      onChange(val);
    }
  };

  const handleCreate = () => {
    const groupName = newGroup.trim();
    if (groupName && !groups.includes(groupName)) {
      onCreateGroup(groupName);
      onChange(groupName);
      setCreating(false);
      setNewGroup("");
    }
  };

  return creating ? (
    <div className="flex gap-2 items-center">
      <Input
        id="new-group-input"
        placeholder="Nome do novo grupo"
        value={newGroup}
        onChange={(e) => setNewGroup(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleCreate();
        }}
        className="flex-1"
        autoFocus
      />
      <Button size="sm" type="button" onClick={handleCreate} disabled={!newGroup.trim()}>
        <Plus className="h-4 w-4 mr-1" />Criar
      </Button>
      <Button size="sm" variant="ghost" type="button" onClick={() => setCreating(false)}>
        Cancelar
      </Button>
    </div>
  ) : (
    <Select value={value} onValueChange={handleSelect}>
      <SelectTrigger>
        <SelectValue placeholder="Escolha um grupo" />
      </SelectTrigger>
      <SelectContent>
        {/* Only map groups with real, non-empty values */}
        {groups.map((group) =>
          group ? <SelectItem key={group} value={group}>{group}</SelectItem> : null
        )}
        <SelectItem value="__new__" className="text-green-700">+ Criar novo grupo...</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default GroupSelector;
